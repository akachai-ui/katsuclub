"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Plus,
  Search,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  List,
  Table as TableIcon,
  Trash2,
  Pencil,
  ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Coins,
  Layers,
  Calendar,
  Building2,
  Tag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Ingredient {
  id: string;
  name: string;
  category?: string | null;
  package_type: string;
  package_size: number;
  unit: string;
  stock_qty: number;
  total_volume: number;
  price_per_package: number;
  cost_per_unit: number;
  image_url?: string | null;
  supplier: string | null;
  expiry_date: string | null;
  note: string | null;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { name: "เนื้อสัตว์", icon: "🥩", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { name: "ข้าวและแป้ง", icon: "🍚", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "เครื่องปรุงและซอส", icon: "🧂", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "ผักและของสด", icon: "🥬", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "ไข่และนม", icon: "🥚", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { name: "บรรจุภัณฑ์และของใช้", icon: "📦", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "ทั่วไป", icon: "🏷️", color: "bg-stone-50 text-stone-700 border-stone-200" },
];

const getCategoryBadge = (catName?: string | null) => {
  const found = CATEGORY_OPTIONS.find((c) => c.name === catName);
  if (found) return found;
  return {
    name: catName || "ทั่วไป",
    icon: "🏷️",
    color: "bg-stone-50 text-stone-700 border-stone-200",
  };
};

const PACKAGE_TYPES = [
  { name: "ถุง", icon: "🛍️" },
  { name: "ขวด", icon: "🍾" },
  { name: "แกลลอน", icon: "🛢️" },
  { name: "ปี๊บ", icon: "🥫" },
  { name: "แผง", icon: "🥚" },
  { name: "แพ็ค", icon: "📦" },
  { name: "ลัง", icon: "📦" },
];

const UNIT_OPTIONS = ["กก.", "กรัม", "ลิตร", "มล.", "ฟอง", "ชิ้น"];

const SUPPLIER_PRESETS = [
  "Makro (แม็คโคร)",
  "Betagro (เบทาโกร)",
  "CP (ซีพี)",
  "ตลาดสดเช้า",
  "Lotus (โลตัส)",
  "Big C",
];

const getPackageIcon = (type: string) => {
  const found = PACKAGE_TYPES.find((p) => p.name === type);
  return found ? found.icon : "📦";
};

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterPkg, setSelectedFilterPkg] = useState<string>("all");
  const [selectedFilterCat, setSelectedFilterCat] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "price" | "qty">("newest");
  const [viewMode, setViewMode] = useState<"table" | "card" | "compact">("table");

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Ingredient | null>(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Add Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("เนื้อสัตว์");
  const [packageType, setPackageType] = useState("ถุง");
  const [packageSize, setPackageSize] = useState("15");
  const [unit, setUnit] = useState("กก.");
  const [stockQty, setStockQty] = useState("1");
  const [pricePerPackage, setPricePerPackage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [supplier, setSupplier] = useState("Makro (แม็คโคร)");
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");

  // Edit Form Fields
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("เนื้อสัตว์");
  const [editPackageType, setEditPackageType] = useState("ถุง");
  const [editPackageSize, setEditPackageSize] = useState("1");
  const [editUnit, setEditUnit] = useState("กก.");
  const [editStockQty, setEditStockQty] = useState("1");
  const [editPricePerPackage, setEditPricePerPackage] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editNote, setEditNote] = useState("");

  // Add Form Calculations
  const parsedSize = parseFloat(packageSize) || 0;
  const parsedQty = parseFloat(stockQty) || 0;
  const parsedPrice = parseFloat(pricePerPackage) || 0;
  const calculatedTotalVolume = Number((parsedQty * parsedSize).toFixed(2));
  const calculatedTotalPrice = Number((parsedQty * parsedPrice).toFixed(2));
  const calculatedCostPerUnit =
    parsedSize > 0 ? Number((parsedPrice / parsedSize).toFixed(2)) : 0;

  // Edit Form Calculations
  const parsedEditSize = parseFloat(editPackageSize) || 0;
  const parsedEditQty = parseFloat(editStockQty) || 0;
  const parsedEditPrice = parseFloat(editPricePerPackage) || 0;
  const calculatedEditTotalVolume = Number((parsedEditQty * parsedEditSize).toFixed(2));
  const calculatedEditTotalPrice = Number((parsedEditQty * parsedEditPrice).toFixed(2));
  const calculatedEditCostPerUnit =
    parsedEditSize > 0 ? Number((parsedEditPrice / parsedEditSize).toFixed(2)) : 0;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setIngredients(data as Ingredient[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const { data, error } = await supabase
          .from("ingredients")
          .select("*")
          .order("created_at", { ascending: false });

        if (!ignore) {
          if (!error && data) {
            setIngredients(data as Ingredient[]);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Open Edit Modal
  const openEditModal = (item: Ingredient) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCategory(item.category || "เนื้อสัตว์");
    setEditPackageType(item.package_type || "ถุง");
    setEditPackageSize(String(item.package_size || 1));
    setEditUnit(item.unit || "กก.");
    setEditStockQty(String(item.stock_qty || 1));
    setEditPricePerPackage(String(item.price_per_package || ""));
    setEditImageUrl(item.image_url || "");
    setEditSupplier(item.supplier || "");
    setEditExpiryDate(item.expiry_date || "");
    setEditNote(item.note || "");
    setDetailItem(null);
    setIsEditModalOpen(true);
  };

  // Submit Add
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("กรุณากรอกชื่อวัตถุดิบ");
      return;
    }
    if (parsedSize <= 0) {
      alert("กรุณากรอกปริมาณต่อชิ้นให้มากกว่า 0");
      return;
    }
    if (parsedQty <= 0) {
      alert("กรุณากรอกจำนวนที่ซื้อเข้าให้มากกว่า 0");
      return;
    }

    setSaving(true);
    try {
      const finalCategory = category.trim() || "ทั่วไป";
      const payload: Record<string, unknown> = {
        name: name.trim(),
        category: finalCategory,
        package_type: packageType,
        package_size: parsedSize,
        unit: unit,
        stock_qty: parsedQty,
        total_volume: calculatedTotalVolume,
        price_per_package: parsedPrice,
        cost_per_unit: calculatedCostPerUnit,
        supplier: supplier.trim() || null,
        expiry_date: expiryDate || null,
        note: note.trim() || null,
      };

      if (imageUrl.trim()) {
        payload.image_url = imageUrl.trim();
      }

      let newIng: Ingredient | null = null;
      const res = await supabase.from("ingredients").insert(payload).select().single();

      if (res.error) {
        let hasRetried = false;
        if (res.error.message.includes("category")) {
          delete payload.category;
          hasRetried = true;
        }
        if (res.error.message.includes("image_url")) {
          delete payload.image_url;
          hasRetried = true;
        }
        if (hasRetried) {
          const retryRes = await supabase
            .from("ingredients")
            .insert(payload)
            .select()
            .single();
          if (retryRes.error) {
            if (retryRes.error.message.includes("category")) {
              delete payload.category;
              const retry2 = await supabase
                .from("ingredients")
                .insert(payload)
                .select()
                .single();
              if (retry2.error) throw retry2.error;
              newIng = retry2.data as Ingredient;
            } else if (retryRes.error.message.includes("image_url")) {
              delete payload.image_url;
              const retry2 = await supabase
                .from("ingredients")
                .insert(payload)
                .select()
                .single();
              if (retry2.error) throw retry2.error;
              newIng = retry2.data as Ingredient;
            } else {
              throw retryRes.error;
            }
          } else {
            newIng = retryRes.data as Ingredient;
          }
        } else {
          throw res.error;
        }
      } else {
        newIng = res.data as Ingredient;
      }

      if (newIng) {
        const transPayload: Record<string, unknown> = {
          ingredient_id: newIng.id,
          transaction_type: "RECEIVE",
          category: finalCategory,
          package_qty: parsedQty,
          package_type: packageType,
          package_size: parsedSize,
          unit: unit,
          total_volume: calculatedTotalVolume,
          price_per_package: parsedPrice,
          total_price: calculatedTotalPrice,
          cost_per_unit: calculatedCostPerUnit,
          supplier: supplier.trim() || null,
          expiry_date: expiryDate || null,
          note: note.trim() || null,
        };
        const transRes = await supabase.from("stock_transactions").insert(transPayload);
        if (transRes.error && transRes.error.message.includes("category")) {
          delete transPayload.category;
          await supabase.from("stock_transactions").insert(transPayload);
        }
      }

      showNotification(`เพิ่ม "${name}" เรียบร้อยแล้ว`);
      setIsModalOpen(false);

      // Reset
      setName("");
      setCategory("เนื้อสัตว์");
      setPackageSize("15");
      setStockQty("1");
      setPricePerPackage("");
      setImageUrl("");
      setExpiryDate("");
      setNote("");

      fetchIngredients();
    } catch (err: unknown) {
      console.error(err);
      alert(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName.trim()) return;

    if (parsedEditSize <= 0) {
      alert("กรุณากรอกปริมาณต่อชิ้นให้มากกว่า 0");
      return;
    }
    if (parsedEditQty < 0) {
      alert("จำนวนสต็อกต้องไม่ติดลบ");
      return;
    }

    setUpdating(true);
    try {
      const finalEditCategory = editCategory.trim() || "ทั่วไป";
      const payload: Record<string, unknown> = {
        name: editName.trim(),
        category: finalEditCategory,
        package_type: editPackageType,
        package_size: parsedEditSize,
        unit: editUnit,
        stock_qty: parsedEditQty,
        total_volume: calculatedEditTotalVolume,
        price_per_package: parsedEditPrice,
        cost_per_unit: calculatedEditCostPerUnit,
        supplier: editSupplier.trim() || null,
        expiry_date: editExpiryDate || null,
        note: editNote.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editImageUrl.trim()) {
        payload.image_url = editImageUrl.trim();
      } else {
        payload.image_url = null;
      }

      const res = await supabase
        .from("ingredients")
        .update(payload)
        .eq("id", editId);

      if (res.error) {
        let hasRetried = false;
        if (res.error.message.includes("category")) {
          delete payload.category;
          hasRetried = true;
        }
        if (res.error.message.includes("image_url")) {
          delete payload.image_url;
          hasRetried = true;
        }
        if (hasRetried) {
          const retryRes = await supabase
            .from("ingredients")
            .update(payload)
            .eq("id", editId);
          if (retryRes.error) {
            if (retryRes.error.message.includes("category")) {
              delete payload.category;
              const retry2 = await supabase
                .from("ingredients")
                .update(payload)
                .eq("id", editId);
              if (retry2.error) throw retry2.error;
            } else if (retryRes.error.message.includes("image_url")) {
              delete payload.image_url;
              const retry2 = await supabase
                .from("ingredients")
                .update(payload)
                .eq("id", editId);
              if (retry2.error) throw retry2.error;
            } else {
              throw retryRes.error;
            }
          }
        } else {
          throw res.error;
        }
      }

      showNotification(`อัปเดต "${editName}" เรียบร้อยแล้ว`);
      setIsEditModalOpen(false);
      fetchIngredients();
    } catch (err: unknown) {
      console.error(err);
      alert(`เกิดข้อผิดพลาดในการแก้ไข: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpdating(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string, itemName: string) => {
    if (!confirm(`ต้องการลบรายการ "${itemName}" ใช่หรือไม่?`)) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;

      showNotification(`ลบ "${itemName}" เรียบร้อยแล้ว`);
      setDetailItem(null);
      fetchIngredients();
    } catch (err) {
      console.error(err);
      alert("ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter & Sort
  const filteredIngredients = useMemo(() => {
    return ingredients
      .filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        const matchSearch =
          !query ||
          item.name.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query)) ||
          (item.supplier && item.supplier.toLowerCase().includes(query));
        const matchPkg =
          selectedFilterPkg === "all" || item.package_type === selectedFilterPkg;
        const matchCat =
          selectedFilterCat === "all" || (item.category || "ทั่วไป") === selectedFilterCat;
        return matchSearch && matchPkg && matchCat;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "th");
        if (sortBy === "price") return b.cost_per_unit - a.cost_per_unit;
        if (sortBy === "qty") return b.total_volume - a.total_volume;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [ingredients, searchQuery, selectedFilterPkg, selectedFilterCat, sortBy]);

  const totalItemsCount = ingredients.length;
  const totalValue = ingredients.reduce(
    (sum, item) => sum + item.stock_qty * item.price_per_package,
    0
  );

  const availablePackages = useMemo(() => {
    const set = new Set(ingredients.map((i) => i.package_type));
    return Array.from(set);
  }, [ingredients]);

  const availableCategories = useMemo(() => {
    const set = new Set(ingredients.map((i) => i.category || "ทั่วไป"));
    return Array.from(set);
  }, [ingredients]);

  return (
    <div className="min-h-screen bg-[#F5F0E9] flex flex-col justify-start">
      {/* Top Brand Accent bar */}
      <div className="h-1.5 w-full bg-[#D9381E]" />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl bg-[#231815] text-white text-xs font-semibold shadow-xl flex items-center gap-2.5 border border-white/10 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Responsive Container: Mobile to PC Full Dashboard */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 pb-28 sm:pb-12 flex-1 flex flex-col">
        {/* Top Navbar / Header */}
        <header className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-[#E7DDD2] shadow-xs mb-3 sm:mb-6">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <Link
                href="/"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E5DAD0] flex items-center justify-center text-stone-700 hover:bg-[#F2EAE1] active:scale-95 transition-all shadow-2xs flex-shrink-0"
                title="กลับหน้าหลัก"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#E8DFD6] flex items-center justify-center p-1 flex-shrink-0">
                  <Image
                    src="/logo-katsuclub.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base sm:text-xl font-black text-[#231815] truncate">
                      คลังวัตถุดิบ
                    </h1>
                    <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-[#D9381E] text-white flex-shrink-0">
                      KATSU
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-stone-400 font-medium truncate">
                    ระบบสต็อก บรรจุภัณฑ์ และต้นทุน
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={fetchIngredients}
                title="รีเฟรชข้อมูล"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-[#E5DAD0] flex items-center justify-center text-stone-600 hover:bg-[#FAF7F2] active:scale-95 transition-all shadow-2xs"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-[#D9381E]" : ""}`}
                />
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#D9381E] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm hover:bg-[#B82B14] active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden xs:inline">นำเข้าวัตถุดิบ</span>
                <span className="xs:hidden">นำเข้า</span>
              </button>
            </div>
          </div>

          {/* KPI Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#F2EAE2]">
            <div className="bg-[#FAF7F2] p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9DFD5] flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#FFF5EE] text-[#D9381E] flex items-center justify-center font-bold flex-shrink-0">
                <Package className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-stone-500 font-medium truncate">
                  วัตถุดิบทั้งหมด
                </div>
                <div className="text-base sm:text-2xl font-black text-[#231815]">
                  {totalItemsCount}{" "}
                  <span className="text-[10px] sm:text-xs font-normal text-stone-400">รายการ</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9DFD5] flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                <Coins className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-stone-500 font-medium truncate">
                  มูลค่าสต็อกรวม
                </div>
                <div className="text-base sm:text-2xl font-black text-[#231815] truncate">
                  ฿{totalValue.toLocaleString()}{" "}
                  <span className="text-[10px] sm:text-xs font-normal text-stone-400">บาท</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-3 sm:p-4 rounded-2xl border border-[#E9DFD5] hidden lg:flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] text-[#231815] flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-stone-500 font-medium">
                  รูปแบบบรรจุภัณฑ์
                </div>
                <div className="text-2xl font-black text-[#231815]">
                  {availablePackages.length}{" "}
                  <span className="text-xs font-normal text-stone-400">ประเภท</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar: Compact 2-Row Layout (Ultra Space-Saving) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 border border-[#E7DDD2] shadow-xs mb-3 sm:mb-4 space-y-2">
          {/* Row 1: Search Box + View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อวัตถุดิบ, หมวดหมู่, แหล่งซื้อ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl p-0.5 flex items-center flex-shrink-0">
              <button
                onClick={() => setViewMode("table")}
                title="มุมมองตาราง"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-[#231815] text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("card")}
                title="มุมมองการ์ด"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "card"
                    ? "bg-[#231815] text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                title="มุมมองกะทัดรัด"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "compact"
                    ? "bg-[#231815] text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Filter Pills + Sort + Result Count (1 Scrollable Row) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            {/* Category Filter Pill */}
            <div className="relative flex-shrink-0">
              <select
                value={selectedFilterCat}
                onChange={(e) => setSelectedFilterCat(e.target.value)}
                className={`appearance-none pl-2.5 pr-6 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none ${
                  selectedFilterCat !== "all"
                    ? "bg-[#D9381E] text-white border-[#D9381E] shadow-xs"
                    : "bg-[#FAF7F2] text-stone-700 border-[#E2D6CB] hover:bg-[#F2EAE1]"
                }`}
              >
                <option value="all">🏷️ ทุกหมวดหมู่</option>
                {availableCategories.map((cat) => {
                  const badge = getCategoryBadge(cat);
                  const count = ingredients.filter(
                    (i) => (i.category || "ทั่วไป") === cat
                  ).length;
                  return (
                    <option key={cat} value={cat}>
                      {badge.icon} {cat} ({count})
                    </option>
                  );
                })}
              </select>
              <div
                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] ${
                  selectedFilterCat !== "all" ? "text-white" : "text-stone-400"
                }`}
              >
                ▼
              </div>
            </div>

            {/* Package Filter Pill */}
            <div className="relative flex-shrink-0">
              <select
                value={selectedFilterPkg}
                onChange={(e) => setSelectedFilterPkg(e.target.value)}
                className={`appearance-none pl-2.5 pr-6 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none ${
                  selectedFilterPkg !== "all"
                    ? "bg-[#D9381E] text-white border-[#D9381E] shadow-xs"
                    : "bg-[#FAF7F2] text-stone-700 border-[#E2D6CB] hover:bg-[#F2EAE1]"
                }`}
              >
                <option value="all">📦 บรรจุภัณฑ์: ทั้งหมด</option>
                {availablePackages.map((pkg) => {
                  const count = ingredients.filter(
                    (i) => i.package_type === pkg
                  ).length;
                  return (
                    <option key={pkg} value={pkg}>
                      {getPackageIcon(pkg)} {pkg} ({count})
                    </option>
                  );
                })}
              </select>
              <div
                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] ${
                  selectedFilterPkg !== "all" ? "text-white" : "text-stone-400"
                }`}
              >
                ▼
              </div>
            </div>

            {/* Sort Pill */}
            <div className="relative flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "newest" | "name" | "price" | "qty"
                  )
                }
                className="appearance-none pl-2.5 pr-6 py-1 rounded-xl text-xs font-bold bg-[#FAF7F2] text-stone-700 border border-[#E2D6CB] hover:bg-[#F2EAE1] transition-all cursor-pointer focus:outline-none"
              >
                <option value="newest">⚡ ล่าสุด</option>
                <option value="name">ก-ฮ ชื่อ</option>
                <option value="price">฿ ราคาสูง</option>
                <option value="qty">📦 สต็อกมาก</option>
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-stone-400">
                ▼
              </div>
            </div>

            {/* Count & Quick Reset */}
            <div className="flex items-center gap-1.5 ml-auto flex-shrink-0 pl-1 text-[11px] text-stone-500 font-medium">
              <span>
                (<strong>{filteredIngredients.length}</strong>/{ingredients.length})
              </span>
              {(selectedFilterPkg !== "all" ||
                selectedFilterCat !== "all" ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFilterPkg("all");
                    setSelectedFilterCat("all");
                  }}
                  className="px-2 py-0.5 rounded-lg bg-red-50 text-[#D9381E] font-bold text-[10px] hover:bg-red-100 transition-colors"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1">
          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-[#E7DDD2] flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#D9381E] mb-3" />
              <p className="text-sm font-medium">กำลังโหลดข้อมูลคลังวัตถุดิบ...</p>
            </div>
          ) : ingredients.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border-2 border-dashed border-[#E5DAD0] shadow-xs">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-[#FAF0E6] text-[#D9381E] flex items-center justify-center mb-4">
                <Package className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#231815]">
                ยังไม่มีข้อมูลวัตถุดิบในระบบ
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto">
                เริ่มต้นโดยคลิกปุ่มนำเข้า เพื่อบันทึกวัตถุดิบและคำนวณต้นทุน
              </p>

              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D9381E] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[#B82B14] active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ นำเข้าวัตถุดิบแรก</span>
              </button>
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#E5DAD0]">
              <p className="text-sm text-stone-500">
                ไม่พบข้อมูลที่ตรงกับ &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilterPkg("all");
                }}
                className="mt-3 text-xs text-[#D9381E] font-bold hover:underline"
              >
                ล้างคำค้นหาและตัวกรอง
              </button>
            </div>
          ) : viewMode === "table" ? (
            /* ========================================================= */
            /* 📊 DESKTOP TABLE VIEW & MOBILE ADAPTIVE FEED */
            /* ========================================================= */
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-3xl border border-[#E7DDD2] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-stone-500 font-bold border-b border-[#EBE2D8] text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">รูปภาพ</th>
                      <th className="py-3.5 px-4">ชื่อวัตถุดิบ</th>
                      <th className="py-3.5 px-4">หมวดหมู่</th>
                      <th className="py-3.5 px-4">บรรจุภัณฑ์</th>
                      <th className="py-3.5 px-4 text-center">คงเหลือ (ชิ้น)</th>
                      <th className="py-3.5 px-4 text-right">ปริมาณรวม</th>
                      <th className="py-3.5 px-4 text-right">ราคา/ชิ้น</th>
                      <th className="py-3.5 px-4 text-right">ต้นทุนเฉลี่ย</th>
                      <th className="py-3.5 px-4">แหล่งซื้อ</th>
                      <th className="py-3.5 px-4">วันหมดอายุ</th>
                      <th className="py-3.5 px-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EAE2]">
                    {filteredIngredients.map((item) => {
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#FAF7F2] transition-colors group"
                        >
                          {/* 1. Thumbnail */}
                          <td className="py-3 px-4">
                            <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] overflow-hidden flex items-center justify-center border border-[#F2DECE]">
                              {item.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <span className="text-base">
                                  {getPackageIcon(item.package_type)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Name */}
                          <td className="py-3 px-4 font-bold text-stone-900 text-sm">
                            <div
                              onClick={() => setDetailItem(item)}
                              className="cursor-pointer hover:text-[#D9381E] transition-colors"
                            >
                              {item.name}
                            </div>
                            {item.note && (
                              <div className="text-[10px] text-stone-400 font-normal truncate max-w-xs">
                                {item.note}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            {(() => {
                              const cat = getCategoryBadge(item.category);
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${cat.color}`}
                                >
                                  <span>{cat.icon}</span>
                                  <span>{cat.name}</span>
                                </span>
                              );
                            })()}
                          </td>

                          {/* 3. Package Info */}
                          <td className="py-3 px-4 text-stone-600">
                            <span className="inline-flex items-center gap-1 bg-[#FAF0E6] text-[#231815] font-semibold px-2 py-0.5 rounded-lg border border-[#F2DECE] text-[11px]">
                              <span>{getPackageIcon(item.package_type)}</span>
                              <span>
                                {item.package_type} ({item.package_size} {item.unit})
                              </span>
                            </span>
                          </td>

                          {/* 4. Stock Qty */}
                          <td className="py-3 px-4 text-center">
                            <span className="font-black text-sm text-[#231815]">
                              {item.stock_qty}
                            </span>{" "}
                            <span className="text-stone-400 text-[11px]">
                              {item.package_type}
                            </span>
                          </td>

                          {/* 5. Total Volume */}
                          <td className="py-3 px-4 text-right">
                            <span className="font-black text-sm text-[#D9381E]">
                              {item.total_volume}
                            </span>{" "}
                            <span className="text-stone-500 font-bold text-[11px]">
                              {item.unit}
                            </span>
                          </td>

                          {/* 6. Price per Package */}
                          <td className="py-3 px-4 text-right font-bold text-stone-800">
                            ฿{item.price_per_package}
                          </td>

                          {/* 7. Cost per Unit */}
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-stone-800">
                              ฿{item.cost_per_unit}
                            </span>
                            <span className="text-stone-400 text-[10px] block">
                              /{item.unit}
                            </span>
                          </td>

                          {/* 8. Supplier */}
                          <td className="py-3 px-4 text-stone-600 font-medium">
                            {item.supplier ? (
                              <span className="inline-flex items-center gap-1 text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                                {item.supplier}
                              </span>
                            ) : (
                              <span className="text-stone-300">-</span>
                            )}
                          </td>

                          {/* 9. Expiry Date */}
                          <td className="py-3 px-4 text-stone-600 font-medium">
                            {item.expiry_date ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                {item.expiry_date}
                              </span>
                            ) : (
                              <span className="text-stone-300">-</span>
                            )}
                          </td>

                          {/* 10. Actions: Direct Edit & Delete */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-[#FAF0E6] text-stone-600 hover:text-[#D9381E] transition-colors"
                                title="แก้ไขรายการ"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                disabled={deletingId === item.id}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Adaptive Feed (for Table view mode on mobile) */}
            <div className="md:hidden space-y-3">
              {filteredIngredients.map((item) => {
                const cat = getCategoryBadge(item.category);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-3.5 border border-[#ECE2D8] shadow-xs flex flex-col justify-between active:scale-[0.99] transition-all"
                  >
                    {/* Top Row: Thumbnail + Info + Stock Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div
                        onClick={() => setDetailItem(item)}
                        className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="w-13 h-13 rounded-xl bg-[#FAF0E6] overflow-hidden flex items-center justify-center text-xl flex-shrink-0 border border-[#F2DECE]">
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            getPackageIcon(item.package_type)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-[#231815] leading-snug truncate">
                            {item.name}
                          </h3>

                          {/* Tags: Category + Package */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border ${cat.color}`}
                            >
                              <span>{cat.icon}</span>
                              <span>{cat.name}</span>
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#FAF0E6] text-[#231815] border border-[#F2DECE]">
                              <span>{getPackageIcon(item.package_type)}</span>
                              <span>
                                1 {item.package_type} ({item.package_size}{" "}
                                {item.unit})
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stock Qty Pill */}
                      <div className="flex-shrink-0 text-right">
                        <span className="px-2 py-1 rounded-lg text-xs font-black bg-[#FAF0E6] text-[#D9381E] border border-[#F2DECE] inline-block">
                          {item.stock_qty} {item.package_type}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid: Total Volume & Cost per Unit */}
                    <div className="mt-3 pt-2.5 border-t border-[#F2EAE2] grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#FAF7F2] p-2 rounded-xl">
                        <span className="text-[10px] text-stone-400 block font-medium">
                          ปริมาณรวมในสต็อก
                        </span>
                        <span className="text-base font-black text-[#D9381E]">
                          {item.total_volume}
                        </span>{" "}
                        <span className="text-xs font-bold text-stone-600">
                          {item.unit}
                        </span>
                      </div>

                      <div className="bg-[#FAF7F2] p-2 rounded-xl text-right">
                        <span className="text-[10px] text-stone-400 block font-medium">
                          ต้นทุน / ราคาซื้อ
                        </span>
                        <span className="text-xs font-black text-stone-800">
                          ฿{item.cost_per_unit}/{item.unit}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          (฿{item.price_per_package}/{item.package_type})
                        </span>
                      </div>
                    </div>

                    {/* Meta Info (Supplier / Expiry / Note) */}
                    {(item.supplier || item.expiry_date || item.note) && (
                      <div className="mt-2 text-[11px] text-stone-500 space-y-0.5 bg-stone-50/60 p-2 rounded-xl">
                        {item.supplier && (
                          <div className="truncate flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-stone-400 flex-shrink-0" />
                            <span className="truncate">
                              ซื้อจาก: {item.supplier}
                            </span>
                          </div>
                        )}
                        {item.expiry_date && (
                          <div className="text-amber-800 flex items-center gap-1.5 text-[10px] font-medium">
                            <Calendar className="w-3 h-3 text-amber-600 flex-shrink-0" />
                            <span>หมดอายุ: {item.expiry_date}</span>
                          </div>
                        )}
                        {item.note && (
                          <div className="text-stone-400 text-[10px] truncate">
                            หมายเหตุ: {item.note}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons: Touch Targets */}
                    <div className="mt-3 pt-2.5 border-t border-[#F2EAE2] flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-[#FAF0E6] text-stone-700 hover:text-[#D9381E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        disabled={deletingId === item.id}
                        className="py-2 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          ) : viewMode === "card" ? (
            /* ========================================================= */
            /* ⊞ RESPONSIVE GRID CARD VIEW */
            /* ========================================================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredIngredients.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-4 border border-[#ECE2D8] shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-[#D9381E] hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-2xl bg-[#FAF0E6] overflow-hidden flex items-center justify-center text-lg flex-shrink-0 border border-[#F2DECE]">
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              getPackageIcon(item.package_type)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-bold text-[#231815] leading-snug">
                                {item.name}
                              </h3>
                              {(() => {
                                const cat = getCategoryBadge(item.category);
                                return (
                                  <span
                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border ${cat.color}`}
                                  >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                  </span>
                                );
                              })()}
                            </div>
                            <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                              1 {item.package_type} ({item.package_size} {item.unit})
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF0E6] text-[#D9381E] border border-[#F2DECE]">
                          {item.stock_qty} {item.package_type}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="mt-3.5 pt-3 border-t border-[#F2EAE2] grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#FAF7F2] p-2 rounded-xl">
                          <span className="text-[10px] text-stone-400 block">
                            ปริมาณรวม
                          </span>
                          <span className="text-base font-black text-[#231815]">
                            {item.total_volume}
                          </span>{" "}
                          <span className="text-xs font-semibold text-stone-500">
                            {item.unit}
                          </span>
                        </div>

                        <div className="bg-[#FAF7F2] p-2 rounded-xl text-right">
                          <span className="text-[10px] text-stone-400 block">
                            ต้นทุนเฉลี่ย
                          </span>
                          <span className="text-sm font-bold text-stone-800">
                            ฿{item.cost_per_unit}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            /{item.unit}
                          </span>
                        </div>
                      </div>

                      {/* Meta info */}
                      {(item.supplier || item.expiry_date) && (
                        <div className="mt-2 text-[11px] text-stone-500 space-y-0.5">
                          {item.supplier && (
                            <div className="truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-stone-400" />
                              <span>{item.supplier}</span>
                            </div>
                          )}
                          {item.expiry_date && (
                            <div className="text-amber-800 flex items-center gap-1 text-[10px]">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span>หมด: {item.expiry_date}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="mt-3 pt-3 border-t border-[#F2EAE2] flex items-center justify-between gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="flex-1 py-1.5 rounded-xl bg-stone-100 hover:bg-[#FAF0E6] text-stone-700 hover:text-[#D9381E] text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================================= */
            /* ≡ COMPACT LIST VIEW */
            /* ========================================================= */
            <div className="bg-white rounded-3xl border border-[#ECE2D8] divide-y divide-[#F4ECE3] shadow-xs overflow-hidden">
              {filteredIngredients.map((item) => {
                return (
                  <div
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF7F2] active:bg-[#F5EFE8] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] overflow-hidden flex items-center justify-center text-base flex-shrink-0 border border-[#F2DECE]">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          getPackageIcon(item.package_type)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#231815] truncate">
                            {item.name}
                          </span>
                          {(() => {
                            const cat = getCategoryBadge(item.category);
                            return (
                              <span
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border flex-shrink-0 ${cat.color}`}
                              >
                                <span>{cat.icon}</span>
                                <span>{cat.name}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-[11px] text-stone-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                          <span className="bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                            {item.stock_qty} {item.package_type}
                          </span>
                          <span>
                            ({item.package_size} {item.unit})
                          </span>
                          {item.supplier && <span>• {item.supplier}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black text-[#231815]">
                        {item.total_volume}{" "}
                        <span className="text-xs font-semibold text-stone-400">
                          {item.unit}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 font-medium">
                        ฿{item.cost_per_unit}/{item.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* DIALOG: ดูรายละเอียดวัตถุดิบ (Detail Modal) */}
      {/* ==================================================================== */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-3 sm:hidden flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F2EAE2]">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF0E6] overflow-hidden flex items-center justify-center text-2xl border border-[#F2DECE]">
                  {detailItem.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={detailItem.image_url}
                      alt={detailItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getPackageIcon(detailItem.package_type)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-[#231815]">
                      {detailItem.name}
                    </h3>
                    {(() => {
                      const cat = getCategoryBadge(detailItem.category);
                      return (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.color}`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    บรรจุ 1 {detailItem.package_type} ({detailItem.package_size}{" "}
                    {detailItem.unit})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailItem(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="py-4 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#ECE2D8]">
                  <div className="text-[10px] text-stone-400">จำนวนคงเหลือ</div>
                  <div className="text-lg font-black text-[#231815] mt-0.5">
                    {detailItem.stock_qty} {detailItem.package_type}
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#ECE2D8]">
                  <div className="text-[10px] text-stone-400">ปริมาณรวมในคลัง</div>
                  <div className="text-lg font-black text-[#D9381E] mt-0.5">
                    {detailItem.total_volume} {detailItem.unit}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#ECE2D8]">
                  <div className="text-[10px] text-stone-400">ราคาซื้อต่อชิ้น</div>
                  <div className="text-sm font-bold text-stone-800 mt-0.5">
                    ฿{detailItem.price_per_package} บาท
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#ECE2D8]">
                  <div className="text-[10px] text-stone-400">ต้นทุนเฉลี่ย</div>
                  <div className="text-sm font-bold text-stone-800 mt-0.5">
                    ฿{detailItem.cost_per_unit}/{detailItem.unit}
                  </div>
                </div>
              </div>

              {detailItem.supplier && (
                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#ECE2D8] flex items-center justify-between">
                  <span className="text-stone-400">แหล่งซื้อ:</span>
                  <span className="font-semibold text-stone-800">
                    {detailItem.supplier}
                  </span>
                </div>
              )}

              {detailItem.expiry_date && (
                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#ECE2D8] flex items-center justify-between">
                  <span className="text-stone-400">วันหมดอายุ:</span>
                  <span className="font-semibold text-amber-800">
                    {detailItem.expiry_date}
                  </span>
                </div>
              )}

              {detailItem.image_url && (
                <div className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#ECE2D8] flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 truncate max-w-xs">
                    {detailItem.image_url}
                  </span>
                  <a
                    href={detailItem.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D9381E] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>ดูรูปเต็ม</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {detailItem.note && (
                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#ECE2D8]">
                  <div className="text-[10px] text-stone-400 mb-0.5">หมายเหตุ:</div>
                  <div className="text-stone-700">{detailItem.note}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() =>
                  handleDeleteItem(detailItem.id, detailItem.name)
                }
                disabled={deletingId === detailItem.id}
                className="py-2.5 px-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบ</span>
              </button>

              <button
                onClick={() => openEditModal(detailItem)}
                className="flex-1 py-2.5 rounded-2xl bg-[#D9381E] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#B82B14] active:scale-95 transition-all shadow-xs"
              >
                <Pencil className="w-4 h-4" />
                <span>แก้ไขรายการนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DIALOG: แก้ไขวัตถุดิบ (Edit Modal - Responsive Desktop & Mobile) */}
      {/* ==================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

            {/* Header */}
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-[#EADFD4] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FAF0E6] text-[#D9381E] flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#231815]">
                    แก้ไขวัตถุดิบ: {editName}
                  </h3>
                  <p className="text-xs text-stone-400">
                    ปรับปรุงข้อมูล บรรจุภัณฑ์ ปริมาณ หรือราคา
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleEditSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
            >
              {/* Section 1 */}
              <div className="bg-white p-4 rounded-2xl border border-[#E9DFD5] space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    ชื่อวัตถุดิบ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    ลิงก์รูปภาพ (Image URL)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl pl-8.5 pr-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                      />
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#E8DFD6] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {editImageUrl.trim() ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editImageUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23bbb' stroke-width='2'><rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='m21 15-5-5L5 21'/></svg>";
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-stone-300" />
                      )}
                    </div>
                  </div>
                </div>

                {/* หมวดหมู่วัตถุดิบ */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#D9381E]" />
                      <span>หมวดหมู่วัตถุดิบ</span> <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-stone-400">
                      คลิกเลือก หรือพิมพ์หมวดหมู่เองได้
                    </span>
                  </div>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        type="button"
                        key={cat.name}
                        onClick={() => setEditCategory(cat.name)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                          editCategory === cat.name
                            ? "bg-[#231815] text-white shadow-xs font-bold"
                            : "bg-[#FAF7F2] text-stone-600 border border-[#E5DAD0] hover:bg-[#F2EAE1]"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom category input with datalist */}
                  <div className="relative">
                    <input
                      type="text"
                      list="categories-edit-list"
                      placeholder="หรือพิมพ์ชื่อหมวดหมู่อื่นๆ..."
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                    <datalist id="categories-edit-list">
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.name} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    รูปแบบบรรจุภัณฑ์
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PACKAGE_TYPES.map((pkg) => (
                      <button
                        type="button"
                        key={pkg.name}
                        onClick={() => setEditPackageType(pkg.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                          editPackageType === pkg.name
                            ? "bg-[#231815] text-white shadow-xs"
                            : "bg-[#FAF7F2] text-stone-600 border border-[#E5DAD0] hover:bg-[#F2EAE1]"
                        }`}
                      >
                        <span>{pkg.icon}</span>
                        <span>{pkg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      ปริมาณต่อ 1 {editPackageType} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editPackageSize}
                      onChange={(e) => setEditPackageSize(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      หน่วยของปริมาณ
                    </label>
                    <select
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="bg-white p-4 rounded-2xl border border-[#E9DFD5] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      จำนวนคงเหลือ ({editPackageType}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editStockQty}
                      onChange={(e) => setEditStockQty(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-sm font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      ราคาต่อ 1 {editPackageType} (บาท) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editPricePerPackage}
                      onChange={(e) => setEditPricePerPackage(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-sm font-black text-[#D9381E] focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>
                </div>

                {/* Live Computed Summary Card */}
                <div className="bg-[#FAF0E6] p-3 rounded-2xl border border-[#F2DECE] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#D9381E]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>คำนวณอัตโนมัติ:</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-white/80 p-2 rounded-xl border border-[#F2DECE]">
                      <div className="text-[10px] text-stone-500">ปริมาณรวม</div>
                      <div className="text-sm font-black text-stone-800 mt-0.5">
                        {calculatedEditTotalVolume} {editUnit}
                      </div>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-[#F2DECE]">
                      <div className="text-[10px] text-stone-500">ต้นทุนเฉลี่ย</div>
                      <div className="text-sm font-black text-stone-800 mt-0.5">
                        ฿{calculatedEditCostPerUnit}/{editUnit}
                      </div>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-[#F2DECE]">
                      <div className="text-[10px] text-stone-500">ยอดรวมทั้งสิ้น</div>
                      <div className="text-sm font-black text-[#D9381E] mt-0.5">
                        ฿{calculatedEditTotalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="bg-white p-4 rounded-2xl border border-[#E9DFD5] space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    แหล่งจัดซื้อ / ร้านค้า
                  </label>
                  <input
                    type="text"
                    list="edit-suppliers-list"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                  />
                  <datalist id="edit-suppliers-list">
                    {SUPPLIER_PRESETS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      วันหมดอายุ (ถ้ามี)
                    </label>
                    <input
                      type="date"
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      หมายเหตุ
                    </label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-white border border-[#E2D6CB] text-stone-700 font-bold hover:bg-[#F2EAE1] transition-colors"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="flex-2 py-3 rounded-2xl bg-[#D9381E] text-white font-bold shadow-md hover:bg-[#B82B14] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>บันทึกการแก้ไข</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DIALOG: ฟอร์มนำเข้าวัตถุดิบ (Add/Import Modal - Responsive) */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

            {/* Header */}
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-[#EADFD4] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFF5EE] text-[#D9381E] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#231815]">
                    นำเข้าวัตถุดิบใหม่
                  </h3>
                  <p className="text-xs text-stone-400">
                    ระบุบรรจุภัณฑ์ ปริมาณ ราคา และรูปภาพ
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleImportSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
            >
              {/* 1. ชื่อวัตถุดิบ & ลิงก์รูปภาพ */}
              <div className="bg-white p-4 rounded-2xl border border-[#E9DFD5] space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    1. ชื่อวัตถุดิบ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ข้าวญี่ปุ่น, ซอสทงคัตสึ, น้ำมันทอด, ไข่ไก่"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                  />
                </div>

                {/* Link ใส่รูปภาพ */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#D9381E]" />
                      <span>ลิงก์รูปภาพ (Image URL)</span>
                    </label>
                    <span className="text-[10px] text-stone-400">
                      วางลิงก์รูปจาก Makro / Google ได้
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="url"
                        placeholder="https://... (URL รูปภาพ)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl pl-8.5 pr-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                      />
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#E8DFD6] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {imageUrl.trim() ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23bbb' stroke-width='2'><rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='m21 15-5-5L5 21'/></svg>";
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-stone-300" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. หมวดหมู่วัตถุดิบ */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#D9381E]" />
                      <span>2. หมวดหมู่วัตถุดิบ</span> <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-stone-400">
                      คลิกเลือก หรือพิมพ์หมวดหมู่เองได้
                    </span>
                  </div>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        type="button"
                        key={cat.name}
                        onClick={() => setCategory(cat.name)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                          category === cat.name
                            ? "bg-[#231815] text-white shadow-xs font-bold"
                            : "bg-[#FAF7F2] text-stone-600 border border-[#E5DAD0] hover:bg-[#F2EAE1]"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom category input with datalist */}
                  <div className="relative">
                    <input
                      type="text"
                      list="categories-add-list"
                      placeholder="หรือพิมพ์ชื่อหมวดหมู่อื่นๆ..."
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                    <datalist id="categories-add-list">
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.name} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* 3. บรรจุภัณฑ์ */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    3. รูปแบบบรรจุภัณฑ์
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PACKAGE_TYPES.map((pkg) => (
                      <button
                        type="button"
                        key={pkg.name}
                        onClick={() => setPackageType(pkg.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                          packageType === pkg.name
                            ? "bg-[#231815] text-white shadow-xs"
                            : "bg-[#FAF7F2] text-stone-600 border border-[#E5DAD0] hover:bg-[#F2EAE1]"
                        }`}
                      >
                        <span>{pkg.icon}</span>
                        <span>{pkg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. ปริมาณต่อชิ้น/บรรจุภัณฑ์ */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      4. ปริมาณต่อ 1 {packageType} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="เช่น 15, 1.8, 30"
                      value={packageSize}
                      onChange={(e) => setPackageSize(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      หน่วยของปริมาณ
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 5 & 6. จำนวนที่ซื้อเข้า และ ราคาซื้อ */}
              <div className="bg-white p-4 rounded-2xl border border-[#E9DFD5] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      5. จำนวน ({packageType}) ที่ซื้อเข้า <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="เช่น 1 หรือ 2"
                      value={stockQty}
                      onChange={(e) => setStockQty(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-sm font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      6. ราคาต่อ 1 {packageType} (บาท) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="เช่น 371"
                      value={pricePerPackage}
                      onChange={(e) => setPricePerPackage(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-sm font-black text-[#D9381E] focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>
                </div>

                {/* Live Computed Summary Card */}
                <div className="bg-[#FAF0E6] p-3 rounded-2xl border border-[#F2DECE] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#D9381E]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ระบบคำนวณให้อัตโนมัติ:</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-white/80 p-2 rounded-xl border border-[#F2DECE]">
                      <div className="text-[10px] text-stone-500">ปริมาณรวม</div>
                      <div className="text-sm font-black text-stone-800 mt-0.5">
                        {calculatedTotalVolume} {unit}
                      </div>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-[#F2DECE]">
                      <div className="text-[10px] text-stone-500">ต้นทุนเฉลี่ย</div>
                      <div className="text-sm font-black text-stone-800 mt-0.5">
                        ฿{calculatedCostPerUnit}/{unit}
                      </div>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-[#F2DECE]">
                      <div className="text-[10px] text-stone-500">ยอดรวมทั้งสิ้น</div>
                      <div className="text-sm font-black text-[#D9381E] mt-0.5">
                        ฿{calculatedTotalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7 & 8: แหล่งซื้อ และ วันหมดอายุ */}
              <div className="bg-white p-4 rounded-2xl border border-[#E9DFD5] space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    7. แหล่งจัดซื้อ / ร้านค้า
                  </label>
                  <input
                    type="text"
                    list="suppliers-list"
                    placeholder="เช่น Makro, Betagro, ตลาดสด"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                  />
                  <datalist id="suppliers-list">
                    {SUPPLIER_PRESETS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      8. วันหมดอายุ (ถ้ามี)
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      9. หมายเหตุ
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น เกรดพรีเมียม"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2D6CB] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-white border border-[#E2D6CB] text-stone-700 font-bold hover:bg-[#F2EAE1] transition-colors"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-2 py-3 rounded-2xl bg-[#D9381E] text-white font-bold shadow-md hover:bg-[#B82B14] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>บันทึกนำเข้าวัตถุดิบ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar */}
      <aside className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DFD6] px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div>
          <div className="text-[11px] text-stone-500 font-medium">
            คลังคงเหลือ ({filteredIngredients.length} รายการ)
          </div>
          <div className="text-base font-black text-[#231815]">
            ฿{totalValue.toLocaleString()}{" "}
            <span className="text-[10px] text-stone-400 font-normal">บาท</span>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-[#D9381E] text-white text-xs font-bold flex items-center gap-2 shadow-md hover:bg-[#B82B14] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>นำเข้าวัตถุดิบ</span>
        </button>
      </aside>
    </div>
  );
}
