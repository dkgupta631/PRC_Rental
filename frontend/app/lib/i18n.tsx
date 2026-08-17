'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { FlagGB, FlagKH, FlagTH, type FlagProps } from '../components/flags';

export type Locale = 'en' | 'th' | 'km';

type Dict = Record<string, string>;

const LOCALE_KEY = 'prc-locale';

export const LANGUAGES: { code: Locale; label: string; Flag: React.ComponentType<FlagProps> }[] = [
  { code: 'en', label: 'English', Flag: FlagGB },
  { code: 'th', label: 'Thai', Flag: FlagTH },
  { code: 'km', label: 'Khmer', Flag: FlagKH },
];

const en: Dict = {
  'common.operations': 'Operations',
  'common.adminUser': 'Admin User',
  'common.logout': 'Logout',
  'common.cancel': 'Cancel',
  'header.occupancyManagement': 'Occupancy management',

  'nav.dashboard': 'Dashboard',
  'nav.addRental': 'Add Rental',
  'nav.records': 'Records',

  'aria.collapseMenu': 'Collapse menu',
  'aria.expandMenu': 'Expand menu',
  'aria.closeMenu': 'Close menu',
  'aria.openMenu': 'Open menu',
  'aria.toggleAutoRefresh': 'Toggle auto-refresh',
  'aria.showPassword': 'Show password',
  'aria.hidePassword': 'Hide password',
  'aria.selectLanguage': 'Select language',

  'login.heroTitle': 'Occupancy management for your rental portfolio.',
  'login.heroSubtitle': 'Replace the manual register with a live dashboard, room tracking, and Excel export.',
  'login.welcomeBack': 'Welcome back',
  'login.signInSubtitle': 'Sign in with your registered mobile number.',
  'login.mobileNumber': 'Mobile number',
  'login.password': 'Password',
  'login.login': 'Login',
  'login.signingIn': 'Signing in...',

  'dashboard.loading': 'Loading dashboard…',
  'dashboard.live': 'Live',
  'dashboard.paused': 'Paused',
  'dashboard.lastUpdated': 'Last updated {time}',
  'dashboard.refreshing': 'Refreshing…',
  'dashboard.autoRefresh': 'Auto-refresh',
  'dashboard.refresh': 'Refresh',
  'dashboard.sectionA': 'Section A',
  'dashboard.buildingOccupancySummary': 'Building Occupancy Summary',
  'dashboard.building': 'Building',
  'dashboard.totalRooms': 'Total Rooms',
  'dashboard.occupiedRooms': 'Occupied Rooms',
  'dashboard.vacantRooms': 'Vacant Rooms',
  'dashboard.occupancy': 'Occupancy',
  'dashboard.occupancyPercent': 'Occupancy %',
  'dashboard.zones': 'Zones',
  'dashboard.sectionC': 'Section C',
  'dashboard.floorStructure': 'Floor Structure by Building',
  'dashboard.buildingLabel': 'Building {building}',
  'dashboard.floorsCount': '{count} floors',
  'dashboard.floor': 'Floor',
  'dashboard.roomRange': 'Room Range',
  'dashboard.total': 'Total',
  'dashboard.sectionD': 'Section D',
  'dashboard.vacantRoomDetail': 'Vacant Room Detail',
  'dashboard.all': 'All',
  'dashboard.vacantCount': '{count} vacant',
  'dashboard.noVacantFiltered': 'No vacant rooms for this filter.',
  'dashboard.sectionE': 'Section E',
  'dashboard.topTenants': 'Top Tenants by Room Count',
  'dashboard.tenant': 'Tenant',
  'dashboard.roomsOccupied': 'Rooms Occupied',

  'rentals.records': 'Records',
  'rentals.rentalRecords': 'Rental Records',
  'rentals.exportToExcel': 'Export to Excel',
  'rentals.allBuildings': 'All Buildings',
  'rentals.allStatus': 'All Status',
  'rentals.occupied': 'Occupied',
  'rentals.vacant': 'Vacant',
  'rentals.searchPlaceholder': 'Search room or company',
  'rentals.sequence': 'Sequence',
  'rentals.room': 'Room',
  'rentals.building': 'Building',
  'rentals.floor': 'Floor',
  'rentals.company': 'Company',
  'rentals.note': 'Note',
  'rentals.actions': 'Actions',
  'rentals.edit': 'Edit',
  'rentals.delete': 'Delete',
  'rentals.deleting': 'Deleting…',
  'rentals.loadingRecords': 'Loading records…',
  'rentals.showing': 'Showing {shown} of {total}',
  'rentals.prev': 'Prev',
  'rentals.next': 'Next',
  'rentals.deleteConfirm': 'Delete room {room}? This cannot be undone.',
  'rentals.deleteError': 'Unable to delete the rental record.',

  'addRental.eyebrow': 'Add Rental',
  'addRental.heading': 'Create a new rental record',
  'addRental.building': 'Building',
  'addRental.floor': 'Floor',
  'addRental.roomNumber': 'Room Number',
  'addRental.roomNumberPlaceholder': 'Pick a vacant room or type a new room number',
  'addRental.roomHintVacant': 'Suggestions above are currently vacant rooms — you can also type a new room number.',
  'addRental.roomHintNone': 'No vacant rooms on file for this floor yet — type a room number to add one.',
  'addRental.companyTenant': 'Company / Tenant',
  'addRental.companyPlaceholder': 'Leave blank for a vacant room',
  'addRental.noteMoveIn': 'Note / Move-in Date',
  'addRental.notePlaceholder': 'Optional note',
  'addRental.moveInDate': 'Move-in Date',
  'addRental.saveRental': 'Save Rental',
  'addRental.saving': 'Saving…',
  'addRental.errorRoomNumber': 'Enter a room number.',
  'addRental.success': 'Rental created successfully.',
  'addRental.errorGeneric': 'Unable to save rental.',

  'editRental.eyebrow': 'Edit Rental',
  'editRental.loading': 'Loading…',
  'editRental.heading': 'Room {room} — Building {building}, Floor {floor}',
  'editRental.companyTenant': 'Company / Tenant',
  'editRental.companyPlaceholder': 'Leave blank to mark this room vacant',
  'editRental.note': 'Note',
  'editRental.notePlaceholder': 'Optional note',
  'editRental.moveInDate': 'Move-in Date',
  'editRental.saveChanges': 'Save Changes',
  'editRental.saving': 'Saving…',
  'editRental.errorLoad': 'Unable to load the rental record.',
  'editRental.success': 'Rental updated successfully.',
  'editRental.errorGeneric': 'Unable to update rental.',
};

const th: Dict = {
  'common.operations': 'ฝ่ายปฏิบัติการ',
  'common.adminUser': 'ผู้ดูแลระบบ',
  'common.logout': 'ออกจากระบบ',
  'common.cancel': 'ยกเลิก',
  'header.occupancyManagement': 'การจัดการอัตราการเข้าพัก',

  'nav.dashboard': 'แดชบอร์ด',
  'nav.addRental': 'เพิ่มห้องเช่า',
  'nav.records': 'รายการบันทึก',

  'aria.collapseMenu': 'ย่อเมนู',
  'aria.expandMenu': 'ขยายเมนู',
  'aria.closeMenu': 'ปิดเมนู',
  'aria.openMenu': 'เปิดเมนู',
  'aria.toggleAutoRefresh': 'เปิด/ปิดการรีเฟรชอัตโนมัติ',
  'aria.showPassword': 'แสดงรหัสผ่าน',
  'aria.hidePassword': 'ซ่อนรหัสผ่าน',
  'aria.selectLanguage': 'เลือกภาษา',

  'login.heroTitle': 'จัดการอัตราการเข้าพักสำหรับพอร์ตห้องเช่าของคุณ',
  'login.heroSubtitle': 'แทนที่สมุดทะเบียนแบบเดิมด้วยแดชบอร์ดแบบเรียลไทม์ การติดตามห้อง และการส่งออกเป็น Excel',
  'login.welcomeBack': 'ยินดีต้อนรับกลับ',
  'login.signInSubtitle': 'เข้าสู่ระบบด้วยหมายเลขโทรศัพท์ที่ลงทะเบียนไว้',
  'login.mobileNumber': 'หมายเลขโทรศัพท์',
  'login.password': 'รหัสผ่าน',
  'login.login': 'เข้าสู่ระบบ',
  'login.signingIn': 'กำลังเข้าสู่ระบบ...',

  'dashboard.loading': 'กำลังโหลดแดชบอร์ด…',
  'dashboard.live': 'กำลังทำงาน',
  'dashboard.paused': 'หยุดชั่วคราว',
  'dashboard.lastUpdated': 'อัปเดตล่าสุด {time}',
  'dashboard.refreshing': 'กำลังรีเฟรช…',
  'dashboard.autoRefresh': 'รีเฟรชอัตโนมัติ',
  'dashboard.refresh': 'รีเฟรช',
  'dashboard.sectionA': 'ส่วนที่ A',
  'dashboard.buildingOccupancySummary': 'สรุปอัตราการเข้าพักของอาคาร',
  'dashboard.building': 'อาคาร',
  'dashboard.totalRooms': 'ห้องทั้งหมด',
  'dashboard.occupiedRooms': 'ห้องที่มีผู้เช่า',
  'dashboard.vacantRooms': 'ห้องว่าง',
  'dashboard.occupancy': 'อัตราการเข้าพัก',
  'dashboard.occupancyPercent': 'อัตราการเข้าพัก %',
  'dashboard.zones': 'โซน',
  'dashboard.sectionC': 'ส่วนที่ C',
  'dashboard.floorStructure': 'โครงสร้างชั้นแยกตามอาคาร',
  'dashboard.buildingLabel': 'อาคาร {building}',
  'dashboard.floorsCount': '{count} ชั้น',
  'dashboard.floor': 'ชั้น',
  'dashboard.roomRange': 'ช่วงเลขห้อง',
  'dashboard.total': 'รวม',
  'dashboard.sectionD': 'ส่วนที่ D',
  'dashboard.vacantRoomDetail': 'รายละเอียดห้องว่าง',
  'dashboard.all': 'ทั้งหมด',
  'dashboard.vacantCount': 'ว่าง {count} ห้อง',
  'dashboard.noVacantFiltered': 'ไม่มีห้องว่างสำหรับตัวกรองนี้',
  'dashboard.sectionE': 'ส่วนที่ E',
  'dashboard.topTenants': 'ผู้เช่าที่มีจำนวนห้องมากที่สุด',
  'dashboard.tenant': 'ผู้เช่า',
  'dashboard.roomsOccupied': 'จำนวนห้องที่เช่า',

  'rentals.records': 'รายการบันทึก',
  'rentals.rentalRecords': 'บันทึกข้อมูลห้องเช่า',
  'rentals.exportToExcel': 'ส่งออกเป็น Excel',
  'rentals.allBuildings': 'ทุกอาคาร',
  'rentals.allStatus': 'ทุกสถานะ',
  'rentals.occupied': 'มีผู้เช่า',
  'rentals.vacant': 'ว่าง',
  'rentals.searchPlaceholder': 'ค้นหาห้องหรือบริษัท',
  'rentals.sequence': 'ลำดับ',
  'rentals.room': 'ห้อง',
  'rentals.building': 'อาคาร',
  'rentals.floor': 'ชั้น',
  'rentals.company': 'บริษัท',
  'rentals.note': 'หมายเหตุ',
  'rentals.actions': 'การดำเนินการ',
  'rentals.edit': 'แก้ไข',
  'rentals.delete': 'ลบ',
  'rentals.deleting': 'กำลังลบ…',
  'rentals.loadingRecords': 'กำลังโหลดรายการ…',
  'rentals.showing': 'แสดง {shown} จาก {total} รายการ',
  'rentals.prev': 'ก่อนหน้า',
  'rentals.next': 'ถัดไป',
  'rentals.deleteConfirm': 'ลบห้อง {room}? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
  'rentals.deleteError': 'ไม่สามารถลบบันทึกห้องเช่าได้',

  'addRental.eyebrow': 'เพิ่มห้องเช่า',
  'addRental.heading': 'สร้างบันทึกห้องเช่าใหม่',
  'addRental.building': 'อาคาร',
  'addRental.floor': 'ชั้น',
  'addRental.roomNumber': 'เลขห้อง',
  'addRental.roomNumberPlaceholder': 'เลือกห้องว่างหรือพิมพ์เลขห้องใหม่',
  'addRental.roomHintVacant': 'ข้อเสนอแนะด้านบนคือห้องที่ว่างอยู่ในขณะนี้ — คุณสามารถพิมพ์เลขห้องใหม่ได้เช่นกัน',
  'addRental.roomHintNone': 'ยังไม่มีห้องว่างในระบบสำหรับชั้นนี้ — พิมพ์เลขห้องเพื่อเพิ่ม',
  'addRental.companyTenant': 'บริษัท / ผู้เช่า',
  'addRental.companyPlaceholder': 'เว้นว่างไว้สำหรับห้องว่าง',
  'addRental.noteMoveIn': 'หมายเหตุ / วันที่เข้าพัก',
  'addRental.notePlaceholder': 'หมายเหตุ (ไม่บังคับ)',
  'addRental.moveInDate': 'วันที่เข้าพัก',
  'addRental.saveRental': 'บันทึกห้องเช่า',
  'addRental.saving': 'กำลังบันทึก…',
  'addRental.errorRoomNumber': 'กรุณากรอกเลขห้อง',
  'addRental.success': 'สร้างบันทึกห้องเช่าสำเร็จ',
  'addRental.errorGeneric': 'ไม่สามารถบันทึกห้องเช่าได้',

  'editRental.eyebrow': 'แก้ไขห้องเช่า',
  'editRental.loading': 'กำลังโหลด…',
  'editRental.heading': 'ห้อง {room} — อาคาร {building} ชั้น {floor}',
  'editRental.companyTenant': 'บริษัท / ผู้เช่า',
  'editRental.companyPlaceholder': 'เว้นว่างไว้เพื่อทำเครื่องหมายห้องนี้ว่าง',
  'editRental.note': 'หมายเหตุ',
  'editRental.notePlaceholder': 'หมายเหตุ (ไม่บังคับ)',
  'editRental.moveInDate': 'วันที่เข้าพัก',
  'editRental.saveChanges': 'บันทึกการเปลี่ยนแปลง',
  'editRental.saving': 'กำลังบันทึก…',
  'editRental.errorLoad': 'ไม่สามารถโหลดบันทึกห้องเช่าได้',
  'editRental.success': 'อัปเดตห้องเช่าสำเร็จ',
  'editRental.errorGeneric': 'ไม่สามารถอัปเดตห้องเช่าได้',
};

const km: Dict = {
  'common.operations': 'ប្រតិបត្តិការ',
  'common.adminUser': 'អ្នកគ្រប់គ្រង',
  'common.logout': 'ចាកចេញ',
  'common.cancel': 'បោះបង់',
  'header.occupancyManagement': 'ការគ្រប់គ្រងអត្រាកន្លែងស្នាក់នៅ',

  'nav.dashboard': 'ផ្ទាំងគ្រប់គ្រង',
  'nav.addRental': 'បន្ថែមការជួល',
  'nav.records': 'កំណត់ត្រា',

  'aria.collapseMenu': 'បង្រួមម៉ឺនុយ',
  'aria.expandMenu': 'ពង្រីកម៉ឺនុយ',
  'aria.closeMenu': 'បិទម៉ឺនុយ',
  'aria.openMenu': 'បើកម៉ឺនុយ',
  'aria.toggleAutoRefresh': 'បើក/បិទការធ្វើឱ្យស្រស់ដោយស្វ័យប្រវត្តិ',
  'aria.showPassword': 'បង្ហាញពាក្យសម្ងាត់',
  'aria.hidePassword': 'លាក់ពាក្យសម្ងាត់',
  'aria.selectLanguage': 'ជ្រើសរើសភាសា',

  'login.heroTitle': 'ការគ្រប់គ្រងអត្រាកន្លែងស្នាក់នៅសម្រាប់ផលប័ត្រជួលរបស់អ្នក',
  'login.heroSubtitle': 'ជំនួសសៀវភៅចុះបញ្ជីដោយដៃដោយផ្ទាំងគ្រប់គ្រងផ្ទាល់ ការតាមដានបន្ទប់ និងការនាំចេញទៅ Excel',
  'login.welcomeBack': 'សូមស្វាគមន៍ការត្រឡប់មកវិញ',
  'login.signInSubtitle': 'ចូលប្រើដោយប្រើលេខទូរស័ព្ទដែលបានចុះឈ្មោះ',
  'login.mobileNumber': 'លេខទូរស័ព្ទ',
  'login.password': 'ពាក្យសម្ងាត់',
  'login.login': 'ចូលប្រើ',
  'login.signingIn': 'កំពុងចូលប្រើ...',

  'dashboard.loading': 'កំពុងផ្ទុកផ្ទាំងគ្រប់គ្រង…',
  'dashboard.live': 'កំពុងផ្សាយផ្ទាល់',
  'dashboard.paused': 'ផ្អាក',
  'dashboard.lastUpdated': 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ {time}',
  'dashboard.refreshing': 'កំពុងធ្វើឱ្យស្រស់…',
  'dashboard.autoRefresh': 'ធ្វើឱ្យស្រស់ដោយស្វ័យប្រវត្តិ',
  'dashboard.refresh': 'ធ្វើឱ្យស្រស់',
  'dashboard.sectionA': 'ផ្នែក A',
  'dashboard.buildingOccupancySummary': 'សេចក្ដីសង្ខេបអត្រាកន្លែងស្នាក់នៅរបស់អគារ',
  'dashboard.building': 'អគារ',
  'dashboard.totalRooms': 'បន្ទប់សរុប',
  'dashboard.occupiedRooms': 'បន្ទប់មានអ្នកជួល',
  'dashboard.vacantRooms': 'បន្ទប់ទំនេរ',
  'dashboard.occupancy': 'អត្រាកន្លែងស្នាក់នៅ',
  'dashboard.occupancyPercent': 'អត្រាកន្លែងស្នាក់នៅ %',
  'dashboard.zones': 'តំបន់',
  'dashboard.sectionC': 'ផ្នែក C',
  'dashboard.floorStructure': 'រចនាសម្ព័ន្ធជាន់តាមអគារ',
  'dashboard.buildingLabel': 'អគារ {building}',
  'dashboard.floorsCount': '{count} ជាន់',
  'dashboard.floor': 'ជាន់',
  'dashboard.roomRange': 'ចន្លោះលេខបន្ទប់',
  'dashboard.total': 'សរុប',
  'dashboard.sectionD': 'ផ្នែក D',
  'dashboard.vacantRoomDetail': 'ព័ត៌មានលម្អិតបន្ទប់ទំនេរ',
  'dashboard.all': 'ទាំងអស់',
  'dashboard.vacantCount': 'ទំនេរ {count} បន្ទប់',
  'dashboard.noVacantFiltered': 'មិនមានបន្ទប់ទំនេរសម្រាប់តម្រងនេះទេ',
  'dashboard.sectionE': 'ផ្នែក E',
  'dashboard.topTenants': 'អ្នកជួលកំពូលតាមចំនួនបន្ទប់',
  'dashboard.tenant': 'អ្នកជួល',
  'dashboard.roomsOccupied': 'បន្ទប់ដែលបានជួល',

  'rentals.records': 'កំណត់ត្រា',
  'rentals.rentalRecords': 'កំណត់ត្រាការជួល',
  'rentals.exportToExcel': 'នាំចេញទៅ Excel',
  'rentals.allBuildings': 'អគារទាំងអស់',
  'rentals.allStatus': 'ស្ថានភាពទាំងអស់',
  'rentals.occupied': 'មានអ្នកជួល',
  'rentals.vacant': 'ទំនេរ',
  'rentals.searchPlaceholder': 'ស្វែងរកបន្ទប់ ឬក្រុមហ៊ុន',
  'rentals.sequence': 'លំដាប់',
  'rentals.room': 'បន្ទប់',
  'rentals.building': 'អគារ',
  'rentals.floor': 'ជាន់',
  'rentals.company': 'ក្រុមហ៊ុន',
  'rentals.note': 'កំណត់ចំណាំ',
  'rentals.actions': 'សកម្មភាព',
  'rentals.edit': 'កែសម្រួល',
  'rentals.delete': 'លុប',
  'rentals.deleting': 'កំពុងលុប…',
  'rentals.loadingRecords': 'កំពុងផ្ទុកកំណត់ត្រា…',
  'rentals.showing': 'បង្ហាញ {shown} នៃ {total}',
  'rentals.prev': 'មុន',
  'rentals.next': 'បន្ទាប់',
  'rentals.deleteConfirm': 'លុបបន្ទប់ {room}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
  'rentals.deleteError': 'មិនអាចលុបកំណត់ត្រាការជួលបានទេ',

  'addRental.eyebrow': 'បន្ថែមការជួល',
  'addRental.heading': 'បង្កើតកំណត់ត្រាការជួលថ្មី',
  'addRental.building': 'អគារ',
  'addRental.floor': 'ជាន់',
  'addRental.roomNumber': 'លេខបន្ទប់',
  'addRental.roomNumberPlaceholder': 'ជ្រើសរើសបន្ទប់ទំនេរ ឬវាយលេខបន្ទប់ថ្មី',
  'addRental.roomHintVacant': 'សំណើខាងលើគឺជាបន្ទប់ដែលកំពុងទំនេរ — អ្នកក៏អាចវាយលេខបន្ទប់ថ្មីបានដែរ',
  'addRental.roomHintNone': 'មិនទាន់មានបន្ទប់ទំនេរនៅក្នុងប្រព័ន្ធសម្រាប់ជាន់នេះទេ — វាយលេខបន្ទប់ដើម្បីបន្ថែម',
  'addRental.companyTenant': 'ក្រុមហ៊ុន / អ្នកជួល',
  'addRental.companyPlaceholder': 'ទុកទទេសម្រាប់បន្ទប់ទំនេរ',
  'addRental.noteMoveIn': 'កំណត់ចំណាំ / កាលបរិច្ឆេទចូលនៅ',
  'addRental.notePlaceholder': 'កំណត់ចំណាំ (មិនចាំបាច់)',
  'addRental.moveInDate': 'កាលបរិច្ឆេទចូលនៅ',
  'addRental.saveRental': 'រក្សាទុកការជួល',
  'addRental.saving': 'កំពុងរក្សាទុក…',
  'addRental.errorRoomNumber': 'សូមបញ្ចូលលេខបន្ទប់',
  'addRental.success': 'បានបង្កើតកំណត់ត្រាការជួលដោយជោគជ័យ',
  'addRental.errorGeneric': 'មិនអាចរក្សាទុកការជួលបានទេ',

  'editRental.eyebrow': 'កែសម្រួលការជួល',
  'editRental.loading': 'កំពុងផ្ទុក…',
  'editRental.heading': 'បន្ទប់ {room} — អគារ {building} ជាន់ {floor}',
  'editRental.companyTenant': 'ក្រុមហ៊ុន / អ្នកជួល',
  'editRental.companyPlaceholder': 'ទុកទទេដើម្បីសម្គាល់បន្ទប់នេះថាទំនេរ',
  'editRental.note': 'កំណត់ចំណាំ',
  'editRental.notePlaceholder': 'កំណត់ចំណាំ (មិនចាំបាច់)',
  'editRental.moveInDate': 'កាលបរិច្ឆេទចូលនៅ',
  'editRental.saveChanges': 'រក្សាទុកការផ្លាស់ប្តូរ',
  'editRental.saving': 'កំពុងរក្សាទុក…',
  'editRental.errorLoad': 'មិនអាចផ្ទុកកំណត់ត្រាការជួលបានទេ',
  'editRental.success': 'បានធ្វើបច្ចុប្បន្នភាពការជួលដោយជោគជ័យ',
  'editRental.errorGeneric': 'មិនអាចធ្វើបច្ចុប្បន្នភាពការជួលបានទេ',
};

const dictionaries: Record<Locale, Dict> = { en, th, km };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start with 'en' on both server and the first client render so hydration
  // matches; the stored preference (browser-only) is applied right after mount.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === 'en' || stored === 'th' || stored === 'km') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from a browser-only store (localStorage) that isn't available during SSR; doing this in render would desync from the server-rendered markup.
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const template = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
      if (!vars) return template;
      return Object.entries(vars).reduce((acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)), template);
    },
    [locale],
  );

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider');
  return ctx;
}
