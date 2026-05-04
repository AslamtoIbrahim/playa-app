<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceItemController extends Controller
{
    /**
     * Ajouter des ouvriers au pointage (Single or Bulk)
     */
    public function store(Request $request, Attendance $attendance)
    { {
            $validated = $request->validate([
                'workers' => 'required|array|min:1',
                'workers.*.worker_id' => 'required|exists:workers,id',
                'workers.*.wage' => 'required|numeric|min:0',
            ]);

            DB::transaction(function () use ($validated, $attendance) { {
                    foreach ($validated['workers'] as $item) { {
                            // Vérifier si l'ouvrier est déjà pointé pour éviter les doublons
                            $exists = $attendance->items()
                                ->where('worker_id', $item['worker_id'])
                                ->exists();

                            if (!$exists) { {
                                    $attendance->items()->create([
                                        'worker_id' => $item['worker_id'],
                                        'wage' => $item['wage'],
                                    ]);
                                }
                            }
                        }
                    }

                    // Mise à jour du total dans le header
                    $attendance->update([
                        'total_wage' => $attendance->items()->sum('wage')
                    ]);
                }
            });

            return redirect()->back()->with('success', 'Liste des ouvriers mise à jour ! ✅');
        }
    }

    /**
     * Mettre à jour le salaire d'un seul ouvrier
     */
    public function update(Request $request, AttendanceItem $item)
    { {
            $validated = $request->validate([
                'wage' => 'required|numeric|min:0',
            ]);

            DB::transaction(function () use ($validated, $item) { {
                    $item->update($validated);

                    // Recalculer le total du header
                    $item->attendance->update([
                        'total_wage' => $item->attendance->items()->sum('wage')
                    ]);
                }
            });

            return redirect()->back()->with('success', 'Salaire modifié. 🔄');
        }
    }

    /**
     * Supprimer un ouvrier du pointage
     */
    public function destroy(AttendanceItem $item)
    { {
            $attendance = $item->attendance;

            DB::transaction(function () use ($item, $attendance) { {
                    $item->delete();

                    // Mise à jour du total après suppression
                    $attendance->update([
                        'total_wage' => $attendance->items()->sum('wage')
                    ]);
                }
            });

            return redirect()->back()->with('success', 'Ouvrier retiré de la liste. 🗑️');
        }
    }


    /**
     * Supprimer tous les ouvriers du pointage d'un coup
     */
    public function bulkDestroy(Attendance $attendance)
    {
        DB::transaction(function () use ($attendance) {
            // كنمسحو كاع الـ items المرتبطين بهاد الـ attendance
            $attendance->items()->delete();

            // كنرجعو الـ total لـ 0 بما أن القائمة ولات خاوية
            $attendance->update([
                'total_wage' => 0
            ]);
        });

        return redirect()->back()->with('success', 'Tous les ouvriers ont été retirés. 🗑️');
    }


    /**
     * Ajouter plusieurs ouvriers d'un coup (Bulk)
     */
    public function bulkStore(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'worker_ids' => 'required|array|min:1',
            'worker_ids.*' => 'exists:workers,id',
            'default_wage' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $attendance) {
            foreach ($validated['worker_ids'] as $workerId) {
                // هاد الدالة كتقلب: يلا لقات العامل كتحّدث ليه الثمن (Wage)
                // ويلا ملقاتوش، كتحل سطر جديد (Create)
                $attendance->items()->updateOrCreate(
                    ['worker_id' => $workerId], // شرط البحث (واش هاد الخدام ديجا كاين؟)
                    ['wage' => $validated['default_wage']] // البيانات اللي غيتزادوا أو يتحدثوا
                );
            }

            // تحديث المجموع الكلي بعد التعديلات
            $attendance->update([
                'total_wage' => $attendance->items()->sum('wage')
            ]);
        });

        return redirect()->back()->with('success', 'Liste mise à jour avec succès ! ✅');
    }
}
