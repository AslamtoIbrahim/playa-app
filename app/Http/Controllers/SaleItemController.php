<?php

namespace App\Http\Controllers;

use App\Models\InvoiceItem;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleItemController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'invoice_item_id' => 'nullable|exists:invoice_items,id',
            'item_id' => 'required|exists:items,id',
            'boat_id' => 'nullable|exists:boats,id',
            'unit_count' => 'required|numeric|not_in:0',
            'sale_price' => 'required|numeric|min:0.01',
            'real_price' => 'required|numeric|min:0',
            'is_with_tax' => 'required|boolean',
        ]);

        return DB::transaction(function () use ($data) {
            $sale = Sale::findOrFail($data['sale_id']);
            $invoiceItem = ! empty($data['invoice_item_id']) ? InvoiceItem::with('invoice.sessionZone')->findOrFail($data['invoice_item_id']) : null;

            if ($invoiceItem && (int) $invoiceItem->invoice?->sessionZone?->daily_session_id !== (int) $sale->session_id) {
                return back()->with('error', 'La vente doit appartenir à la même session que la ligne de facture.');
            }
            if ($invoiceItem) {
                $data['item_id'] = $invoiceItem->item_id;
                $data['boat_id'] = $invoiceItem->boat_id;
            }

            $this->assertStockAvailable($sale, (int) $data['item_id'], abs((float) $data['unit_count']));
            $unitCount = (float) $data['unit_count'];
            $realPrice = (float) $data['real_price'];
            $salePrice = (float) $data['sale_price'];
            $amount = $unitCount * $realPrice;

            $item = SaleItem::create([
                ...$data,
                'invoice_item_id' => $invoiceItem?->id,
                'unit_count' => $unitCount,
                'real_price' => $realPrice,
                'amount' => $amount,
                'tax' => $data['is_with_tax'] ? $amount * 0.03 : 0,
                'total_diff' => ($salePrice - $realPrice) * $unitCount,
            ]);

            return back()->with('success', 'Vente enregistrée.');
        });
    }

    public function update(Request $request, SaleItem $saleItem)
    {
        $data = $request->validate([
            'sale_id' => 'sometimes|exists:sales,id',
            'unit_count' => 'sometimes|numeric|not_in:0',
            'sale_price' => 'sometimes|numeric|min:0.01',
            'real_price' => 'sometimes|numeric|min:0',
            'is_with_tax' => 'sometimes|boolean',
        ]);

        return DB::transaction(function () use ($data, $saleItem) {
            $sale = Sale::findOrFail($data['sale_id'] ?? $saleItem->sale_id);
            if ((int) $sale->session_id !== (int) $saleItem->sale->session_id) {
                return back()->with('error', 'La vente doit rester dans la session courante.');
            }
            $count = (float) ($data['unit_count'] ?? $saleItem->unit_count);
            $price = (float) ($data['sale_price'] ?? $saleItem->sale_price);
            $real = (float) ($data['real_price'] ?? $saleItem->real_price);
            $withTax = (bool) ($data['is_with_tax'] ?? $saleItem->is_with_tax);
            $this->assertStockAvailable($sale, (int) $saleItem->item_id, abs($count), $saleItem->id);
            $saleItem->update([...$data, 'amount' => $count * $real, 'tax' => $withTax ? $count * $real * 0.03 : 0, 'total_diff' => ($price - $real) * $count]);

            return back()->with('success', 'Ligne mise à jour.');
        });
    }

    public function destroy(SaleItem $saleItem)
    {
        $saleItem->delete();
        return back()->with('success', 'Ligne supprimée.');
    }

    private function assertStockAvailable(Sale $sale, int $itemId, float $requested, ?int $exceptId = null): void
    {
        $item = \App\Models\Item::findOrFail($itemId);
        InvoiceItem::whereHas('item', fn ($q) => $q->where('category_id', $item->category_id))
            ->whereHas('invoice.sessionZone', fn ($q) => $q->where('daily_session_id', $sale->session_id))
            ->lockForUpdate()->get(['id']);
        $purchased = (float) InvoiceItem::whereHas('item', fn ($q) => $q->where('category_id', $item->category_id))
            ->whereHas('invoice.sessionZone', fn ($q) => $q->where('daily_session_id', $sale->session_id))
            ->sum('unit_count');
        $soldQuery = SaleItem::whereHas('item', fn ($q) => $q->where('category_id', $item->category_id))
            ->whereHas('sale', fn ($q) => $q->where('session_id', $sale->session_id));
        if ($exceptId) $soldQuery->where('id', '!=', $exceptId);
        $available = $purchased - (float) $soldQuery->sum(DB::raw('ABS(unit_count)'));
        if ($requested > $available + 0.00001) {
            throw ValidationException::withMessages([
                'unit_count' => "Stock insuffisant pour {$item->name} : {$available} unité(s) disponible(s).",
            ]);
        }
    }
}
