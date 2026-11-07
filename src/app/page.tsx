"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Store, ArrowUpRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F0E9] flex flex-col justify-between">
      {/* Top Accent bar */}
      <div className="h-1.5 w-full bg-[#D9381E]" />

      {/* Main Container: Fully responsive from mobile to desktop */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Header / Brand Banner */}
        <header className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E7DDD2] shadow-sm mb-6 sm:mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-[#FAF7F2] border-2 border-[#E8DFD6] flex items-center justify-center p-2 shadow-xs flex-shrink-0">
              <Image
                src="/logo-katsuclub.png"
                alt="KATSU CLUB Logo"
                width={112}
                height={112}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#231815]">
                  KATSU CLUB
                </h1>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#D9381E] text-white">
                  カツ
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#8C7A70] tracking-wider mt-1 uppercase">
                Your Daily Katsu — Restaurant Management System
              </p>
              <p className="text-xs text-stone-500 mt-2 max-w-md hidden sm:block">
                ระบบบริหารจัดการร้านอาหารสไตล์ญี่ปุ่น จัดการสต็อกวัตถุดิบและระบบหน้าร้าน
              </p>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-end text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ระบบออนไลน์ (Supabase)
            </span>
            <span className="text-xs text-stone-400 mt-1.5">
              เวอร์ชัน 1.0 (พร้อมใช้งานทั้ง PC และ Mobile)
            </span>
          </div>
        </header>

        {/* Modules Section */}
        <main className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-[#D9381E]" />
              <span>โมดูลการทำงาน</span>
            </h2>
            <span className="text-xs text-stone-400 hidden sm:inline">
              คลิกเพื่อเปิดระบบที่ต้องการ
            </span>
          </div>

          {/* Module Grid: Responsive 1 col on mobile, 2 or 3 cols on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. วัตถุดิบ (Active Module) */}
            <Link
              href="/ingredients"
              className="group bg-white rounded-3xl p-6 border-2 border-[#E8DFD6] hover:border-[#D9381E] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF5EE] border border-[#FADCC7] flex items-center justify-center text-[#D9381E] group-hover:bg-[#D9381E] group-hover:text-white transition-colors">
                    <Package className="w-7 h-7" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FAF0E6] text-[#D9381E]">
                    พร้อมใช้งาน
                  </span>
                </div>

                <h3 className="text-xl font-black text-[#231815] group-hover:text-[#D9381E] transition-colors">
                  วัตถุดิบ (Ingredients)
                </h3>
                <p className="text-xs text-stone-500 mt-1.5 font-medium leading-relaxed">
                  จัดการคลังวัตถุดิบ บันทึกบรรจุภัณฑ์ (ถุง, ขวด, แกลลอน) ปริมาณ และราคาซื้อ
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F2EAE2] flex items-center justify-between text-xs font-bold text-[#D9381E] group-hover:translate-x-1 transition-transform">
                <span>เข้าสู่ระบบคลังวัตถุดิบ</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Placeholder Module 2: เมนูอาหาร */}
            <div className="bg-white/60 rounded-3xl p-6 border border-[#E8DFD6] border-dashed flex flex-col justify-between opacity-70">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 text-2xl">
                    🍱
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500">
                    ขั้นตอนถัดไป
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-600">เมนูอาหาร & สูตร</h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  จัดหมวดหมู่เมนูทงคัตสึ และตัดสต็อกวัตถุดิบอัตโนมัติตามสูตร
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F2EAE2] text-[11px] text-stone-400 font-medium">
                เตรียมพัฒนาต่อ
              </div>
            </div>

            {/* Placeholder Module 3: ออร์เดอร์ & POS */}
            <div className="bg-white/60 rounded-3xl p-6 border border-[#E8DFD6] border-dashed flex flex-col justify-between opacity-70 hidden sm:flex">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 text-2xl">
                    🧾
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500">
                    ขั้นตอนถัดไป
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-600">รับออร์เดอร์ POS</h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  ระบบคิดเงินหน้าร้าน จัดการโต๊ะ และส่งออร์เดอร์เข้าครัว
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F2EAE2] text-[11px] text-stone-400 font-medium">
                เตรียมพัฒนาต่อ
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#E8DFD6]/60">
        <span>© KATSU CLUB — Restaurant Management System</span>
        <span>รองรับทั้งหน้าจอสมาร์ตโฟน แท็บเล็ต และคอมพิวเตอร์ (PC)</span>
      </footer>
    </div>
  );
}
