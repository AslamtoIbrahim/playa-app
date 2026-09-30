<?php

namespace App\Console\Commands;

use App\Http\Controllers\DifferenceController;
use App\Models\Boat;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use ReflectionMethod;

class BackfillCommissionTwins extends Command
{
    protected $signature = 'commissions:backfill-twins {--dry-run : N’écrit rien}
        {--check : Vérifie ce que le rapport renverrait}';

    protected $description = 'Rattache les commissions historiques à leur jambe jumelle';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $rows = DB::select(
            'SELECT ri.id, ri.real_price, r.date, r.session_zone_id, r.boat_id
             FROM receipt_items ri
             JOIN receipts r ON r.id = ri.receipt_id
             WHERE ri.type = "commission" AND ri.commission_twin_id IS NULL
             ORDER BY ri.id'
        );

        // Appariage en une seule passe avec un registre des ids déjà
        // traités : une jambe ne peut appartenir qu'à un seul couple.
        $used = [];
        $linked = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            if (isset($used[$row->id])) {
                continue;
            }

            // La jambe bénéficiaire (+) est celle dont le bon n'a pas de bateau.
            $isBeneficiary = $row->boat_id === null;

            $targetPrice = $isBeneficiary
                ? -1 * (float) $row->real_price
                : abs((float) $row->real_price);

            $match = null;

            foreach ($rows as $candidate) {
                if ($candidate->id === $row->id || isset($used[$candidate->id])) {
                    continue;
                }

                if ((float) $candidate->real_price !== $targetPrice) {
                    continue;
                }

                if ($candidate->date !== $row->date) {
                    continue;
                }

                if ($candidate->session_zone_id !== $row->session_zone_id) {
                    continue;
                }

                // On cherche la jambe de sens opposé.
                if (($candidate->boat_id === null) === $isBeneficiary) {
                    continue;
                }

                $match = $candidate;
                break;
            }

            if ($match === null) {
                $skipped++;
                $this->warn("Commission #{$row->id} : aucun jumeau trouvé.");

                continue;
            }

            if (! $dryRun) {
                DB::update('UPDATE receipt_items SET commission_twin_id = ? WHERE id = ?', [$match->id, $row->id]);
                DB::update('UPDATE receipt_items SET commission_twin_id = ? WHERE id = ?', [$row->id, $match->id]);
            }

            $used[$row->id] = true;
            $used[$match->id] = true;

            $linked++;
            $this->info("Commission #{$row->id} ↔ #{$match->id}");
        }

        if ($this->option('check')) {
            $this->reportCheck();

            return self::SUCCESS;
        }

        $this->info($dryRun ? 'Dry run' : 'Terminé');
        $this->info("Liaisons : {$linked}, non appariables : {$skipped}");

        return self::SUCCESS;
    }

    /**
     * Simule ce que chaque rapport de bateau renverrait, en appelant la
     * méthode privée réellement utilisée par le contrôleur.
     */
    private function reportCheck(): void
    {
        $controller = new DifferenceController;
        $method = new ReflectionMethod(DifferenceController::class, 'reportCommissions');
        $method->setAccessible(true);

        $boats = DB::select(
            'SELECT DISTINCT r.boat_id, r.date, r.session_zone_id
             FROM receipt_items ri
             JOIN receipts r ON r.id = ri.receipt_id
             WHERE ri.type = "commission" AND r.boat_id IS NOT NULL'
        );

        foreach ($boats as $row) {
            $boat = Boat::find($row->boat_id);

            if (! $boat) {
                continue;
            }

            $found = $method->invoke($controller, $boat, $row->date, $row->session_zone_id);

            $this->info(sprintf(
                'Bateau #%s (%s) date=%s zone=%s → %d commission(s)',
                $boat->id,
                $boat->name,
                $row->date,
                $row->session_zone_id,
                count($found)
            ));

            foreach ($found as $commission) {
                $this->line(sprintf(
                    '    bénéficiaire=%s qté=%s prix=%s',
                    $commission->beneficiary_name,
                    $commission->unit_count,
                    $commission->commission_per_unit
                ));
            }
        }
    }
}
