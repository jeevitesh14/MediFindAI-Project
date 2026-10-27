import { useState, useMemo } from 'react';
import {
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEyeOff,
  FiPackage,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiAlertTriangle,
} from 'react-icons/fi';

export default function PharmacyInventoryTab({
  pharmacy,
  inventory = [],
  loading = false,
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
  onOpenRemoveModal,
  onQuickStockAdjust,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // '' | 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_desc' | 'stock_asc'

  // Compute status counts
  const counts = useMemo(() => {
    const total = inventory.length;
    const available = inventory.filter((i) => i.stockStatus === 'AVAILABLE').length;
    const lowStock = inventory.filter((i) => i.stockStatus === 'LOW_STOCK').length;
    const outOfStock = inventory.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;
    return { total, available, lowStock, outOfStock };
  }, [inventory]);

  // Filter and sort inventory
  const filteredInventory = useMemo(() => {
    let result = [...inventory];

    // Status filter
    if (selectedStatus) {
      result = result.filter((item) => item.stockStatus === selectedStatus);
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((item) => {
        const nameMatch = item.medicineName && item.medicineName.toLowerCase().includes(q);
        const genericMatch = item.genericName && item.genericName.toLowerCase().includes(q);
        const mfgMatch = item.manufacturer && item.manufacturer.toLowerCase().includes(q);
        const catMatch = item.category && item.category.toLowerCase().includes(q);
        return nameMatch || genericMatch || mfgMatch || catMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.medicineName || '').localeCompare(b.medicineName || '');
        case 'name_desc':
          return (b.medicineName || '').localeCompare(a.medicineName || '');
        case 'price_asc':
          return Number(a.price || 0) - Number(b.price || 0);
        case 'price_desc':
          return Number(b.price || 0) - Number(a.price || 0);
        case 'stock_desc':
          return (b.quantity || 0) - (a.quantity || 0);
        case 'stock_asc':
          return (a.quantity || 0) - (b.quantity || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [inventory, selectedStatus, searchTerm, sortBy]);

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stocked medicines by name, generic molecule, category..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="">All Stock ({counts.total})</option>
            <option value="AVAILABLE">In Stock ({counts.available})</option>
            <option value="LOW_STOCK">Low Stock ({counts.lowStock})</option>
            <option value="OUT_OF_STOCK">Out of Stock ({counts.outOfStock})</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="name_asc">Name (A → Z)</option>
            <option value="name_desc">Name (Z → A)</option>
            <option value="price_asc">Price (Low → High)</option>
            <option value="price_desc">Price (High → Low)</option>
            <option value="stock_desc">Stock (High → Low)</option>
            <option value="stock_asc">Stock (Low → High)</option>
          </select>

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh Inventory"
            className="p-2 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-cyan-300 hover:text-white"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="btn-primary py-2 px-3.5 text-xs font-bold shadow-lg shadow-cyan-500/20 inline-flex items-center gap-1.5 shrink-0"
          >
            <FiPlus size={14} />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Status Filter Pills Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <button
          onClick={() => setSelectedStatus('')}
          className={`px-3 py-1 rounded-xl font-bold transition-all ${
            selectedStatus === ''
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All ({counts.total})
        </button>
        <button
          onClick={() => setSelectedStatus('AVAILABLE')}
          className={`px-3 py-1 rounded-xl font-bold transition-all ${
            selectedStatus === 'AVAILABLE'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-emerald-300'
          }`}
        >
          In Stock ({counts.available})
        </button>
        <button
          onClick={() => setSelectedStatus('LOW_STOCK')}
          className={`px-3 py-1 rounded-xl font-bold transition-all ${
            selectedStatus === 'LOW_STOCK'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-amber-300'
          }`}
        >
          Low Stock ({counts.lowStock})
        </button>
        <button
          onClick={() => setSelectedStatus('OUT_OF_STOCK')}
          className={`px-3 py-1 rounded-xl font-bold transition-all ${
            selectedStatus === 'OUT_OF_STOCK'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-rose-300'
          }`}
        >
          Out of Stock ({counts.outOfStock})
        </button>
      </div>

      {/* Inventory List / Table */}
      {loading ? (
        <div className="py-14 text-center text-slate-400 text-xs">
          <FiRefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
          Loading pharmacy stock catalog...
        </div>
      ) : filteredInventory.length > 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-400 sticky top-0 border-b border-slate-800 z-10">
              <tr>
                <th className="px-4 py-3">Medicine Details</th>
                <th className="px-3 py-3">Form & Strength</th>
                <th className="px-3 py-3 text-right">Selling Price</th>
                <th className="px-3 py-3 text-center">Stock Level</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Medicine Details */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm block">{item.medicineName}</span>
                      {item.requiresPrescription ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/25">
                          Rx
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                          OTC
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {item.genericName || item.manufacturer || 'Standard'}
                      {item.category ? ` · ${item.category}` : ''}
                    </span>
                  </td>

                  {/* Form & Strength */}
                  <td className="px-3 py-3 text-slate-300 font-medium">
                    {item.dosageForm || 'Tablet'}
                    {item.strength ? <span className="text-slate-400 font-mono"> · {item.strength}</span> : ''}
                  </td>

                  {/* Price */}
                  <td className="px-3 py-3 text-right font-mono font-bold text-cyan-300 text-sm">
                    ₹{Number(item.price || 0).toFixed(2)}
                  </td>

                  {/* Stock Quantity & Quick Increment/Decrement */}
                  <td className="px-3 py-3 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => onQuickStockAdjust(item, Math.max(0, (item.quantity || 0) - 1))}
                        title="Decrease stock by 1"
                        className="w-5 h-5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-bold text-white px-1 font-mono text-xs">
                        {item.quantity || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuickStockAdjust(item, (item.quantity || 0) + 10)}
                        title="Quick add +10 stock"
                        className="px-1.5 h-5 rounded-md hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 flex items-center justify-center font-bold text-[10px]"
                      >
                        +10
                      </button>
                    </div>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      Min: {item.lowStockThreshold || 10}
                    </span>
                  </td>

                  {/* Stock Status Badge */}
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.stockStatus === 'AVAILABLE'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : item.stockStatus === 'LOW_STOCK'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {item.stockStatus?.replace('_', ' ') || 'AVAILABLE'}
                    </span>
                  </td>

                  {/* Row Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(item)}
                        title="Edit Price & Stock"
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 transition-colors"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenRemoveModal(item)}
                        title="Remove from Store"
                        className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : inventory.length === 0 ? (
        /* Empty State: Pharmacy has no medicines */
        <div className="py-12 px-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
          <div className="p-3 w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <FiPackage size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No Medicines Stocked Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {pharmacy.name} currently has no medicines in its inventory catalog. Add medicines from the central
              catalog to make them discoverable for users.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-2 mt-2"
          >
            <FiPlus size={14} />
            <span>Add First Medicine</span>
          </button>
        </div>
      ) : (
        /* Empty State: No search/filter matches */
        <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-slate-400 text-xs space-y-2">
          <p>No medicines match your current search or status filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('');
            }}
            className="text-cyan-400 font-bold underline"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
