/**
 * lib/i18n.js - Translation and Localization service
 */

export const TRANSLATIONS = {
    vi: {
        // Sidebar
        app_name: "Lịch Của Tôi",
        create: "Tạo mới",
        my_calendars: "Lịch của tôi",
        event: "Sự kiện",
        task: "Việc cần làm",
        appointment: "Lên lịch hẹn",
        my_calendars_title: "Lịch của tôi",
        holidays_title: "Ngày lễ",
        creating: "Đang tạo...",
        deadline_hit: "Chạm hạn chót",
        all_day: "Cả ngày",
        no_events_day: "Bạn chưa lên lịch sự kiện này",
        mini_calendar: {
            days: {
                monday: "T2",
                tuesday: "T3",
                wednesday: "T4",
                thursday: "T5",
                friday: "T6",
                saturday: "T7",
                sunday: "CN"
            }
        },
        year_day_popup: {
            no_events: "Bạn chưa lên lịch sự kiện này",
            all_day: "Cả ngày"
        },
        categories: {
            default: "Mặc định",
            work: "Công việc",
            family: "Gia đình",
            personal: "Cá nhân",
        },
        // Header
        today: "Hôm nay",
        notifications: "Thông báo",
        no_notifications: "Không có thông báo mới",
        mark_all_read: "Đánh dấu đã đọc",
        view_all_notifications: "Xem tất cả thông báo",
        settings: "Cài đặt",
        settings_desc: "Tuỳ chỉnh lịch của bạn",
        trash: "Thùng rác",
        // Views
        view_day: "Ngày",
        view_week: "Tuần",
        view_month: "Tháng",
        view_year: "Năm",
        // System
        system: "Hệ thống",
        upcoming_start: "Sắp diễn ra trong %s phút nữa",
        save_settings: "Lưu cài đặt",
        cancel: "Huỷ",
        saved: "Đã lưu",
        loading: "Đang tải...",
        error: "Lỗi",
        retry: "Thử lại",
        delete: "Xoá",
        deleting: "Đang xoá...",
        save: "Lưu",
        saving: "Đang lưu...",
        update: "Cập nhật",
        search: "Tìm",
        common: {
            close: "Đóng",
            add: "Thêm",
            cancel: "Huỷ",
            save: "Lưu",
            update: "Cập nhật",
            delete: "Xoá",
        },

        // User Menu
        user: {
            welcome: "Xin Chào",
            login: "Đăng nhập",
            register: "Đăng ký",
            logout: "Đăng xuất",
            login_required: "Vui lòng đăng nhập",
        },

        // Right Sidebar
        sidebar_tools: {
            tasks: "Google Tasks",
            keep: "Google Keep",
            maps: "Google Maps",
            contacts: "Danh bạ",
        },

        // Panels
        contacts_panel: {
            title: "Danh bạ",
            search_placeholder: "Tìm kiếm liên hệ...",
            no_contacts: "Chưa có liên hệ nào",
            not_found: "Không tìm thấy liên hệ",
            details: "Chi tiết liên hệ",
            message: "Nhắn tin",
            phone: "Số điện thoại",
            email: "Email",
            loading_error: "Không thể tải danh bạ.",
            contact_label: "Liên hệ",
            tabs: {
                not_connected: "Chưa kết nối",
                connected: "Kết nối",
                invitations: "Lời mời",
            },
            search_user_placeholder: "Nhập email người dùng...",
            connect_btn: "Kết nối",
            accept_btn: "Chấp nhận",
            decline_btn: "Từ chối",
            no_results: "Không thấy người dùng này",
            no_invitations: "Không có khách mời nào",
            request_sent: "Đã gửi",
            unfriend: "Huỷ kết nối",
            block: "Chặn",
            pin: "Ghim",
            unpin: "Bỏ ghim",
            guests: "Khách mời",
            add_guest: "Thêm khách mời",
            permission: "Quyền hạn",
            can_edit: "Chỉnh sửa",
            view_only: "Chỉ xem",
            owned_by: "Người tạo",
            leave_event: "Rời",
            collision_warning: "Sự kiện này trùng lịch với các mục khác của bạn. Bạn vẫn muốn đồng ý?",
            collision_found: "Trùng lịch",
            no_notifications: "Không có thông báo mới",
            invitation_msg: "%s đã mời bạn tham gia sự kiện: %s",
        },
        tasks_panel: {
            add_placeholder: "Thêm công việc...",
            no_tasks: "Không có công việc nào",
            completed_count: "Đã hoàn thành (%s)",
        },
        keep_panel: {
            new_note: "Ghi chú mới",
            title_placeholder: "Tiêu đề",
            content_placeholder: "Nhập ghi chú...",
            pinned: "Đã ghim",
            other: "Khác",
            no_notes: "Chưa có ghi chú nào",
            default_title: "Ghi chú mới",
        },
        maps_panel: {
            search_placeholder: "Tìm kiếm địa điểm...",
            open_in_maps: "Mở trong Google Maps",
        },
        create_modal: {
            confirm_trash: "Bạn có chắc chắn muốn chuyển mục này vào thùng rác?",
            save_error: "Lỗi khi lưu: %s",
            delete_error: "Lỗi khi xoá: %s",
        },

        // Settings Modal
        sections: {
            language: "Ngôn ngữ & Khu vực",
            timezone: "Múi giờ",
            events: "Cài đặt sự kiện",
            notifications: "Thông báo",
            view: "Tuỳ chọn xem",
            calendars: "Lịch yêu thích",
            categories: "Quản lý danh mục",
            active_calendars: "Các lịch đang hiển thị",
            category_list: "Danh sách danh mục",
        },
        lang_region: {
            title: "Ngôn ngữ và Khu vực",
            language: "Ngôn ngữ",
            language_desc: "Ngôn ngữ hiển thị của ứng dụng",
            country: "Quốc gia",
            country_desc: "Quốc gia hoặc vùng lãnh thổ của bạn",
            date_format: "Định dạng ngày",
            date_format_desc: "Cách hiển thị ngày, tháng, năm",
            time_format: "Định dạng giờ",
            time_format_desc: "Hiển thị theo kiểu 12 giờ hoặc 24 giờ",
            hour_12: "12 giờ",
            hour_24: "24 giờ",
        },
        timezone: {
            title: "Múi giờ",
            show_secondary: "Hiển thị múi giờ phụ",
            show_secondary_desc: "Thêm một cột múi giờ thứ hai trên lưới lịch",
            primary: "Múi giờ chính",
            primary_desc: "Múi giờ mặc định của bạn",
            secondary: "Múi giờ phụ",
            secondary_desc: "Múi giờ thứ hai hiển thị bên cạnh",
            secondary_disabled: "Bật tuỳ chọn phía trên để dùng tính năng này",
        },
        event_settings: {
            title: "Cài đặt sự kiện",
            meet_link: "Link Meet mặc định",
            meet_link_desc: "Tự động điền vào mỗi sự kiện mới tạo",
            location: "Vị trí mặc định",
            location_desc: "Địa điểm được điền sẵn khi tạo sự kiện",
            location_placeholder: "Nhập địa điểm...",
        },
        notif_settings: {
            title: "Cài đặt thông báo",
            type: "Loại thông báo",
            off: "Tắt",
            off_desc: "Không nhận bất kỳ thông báo nào",
            screen: "Thông báo trên màn hình",
            screen_desc: "Hiện popup bên trong ứng dụng",
            push: "Thông báo đẩy",
            push_desc: "Thông báo từ trình duyệt / hệ thống",
            reminder: "Nhắc nhở trước",
            reminder_desc: "Hiển thị thông báo bao nhiêu phút trước khi sự kiện bắt đầu",
            minutes: "phút",
        },
        view_options: {
            title: "Tuỳ chọn xem",
            show_weekends: "Hiển thị các ngày cuối tuần",
            show_weekends_desc: "Hiện Thứ Bảy và Chủ Nhật trên lưới lịch",
            show_completed: "Hiển thị việc cần làm đã hoàn tất",
            show_completed_desc: "Các task đã đánh dấu xong vẫn hiện trên lịch",
            show_week_num: "Hiện số tuần",
            show_week_num_desc: "Số thứ tự tuần trong năm (1–52)",
            dim_past: "Giảm độ sáng sự kiện trước đây",
            dim_past_desc: "Làm mờ nhẹ sự kiện đã qua để dễ phân biệt",
            week_start: "Bắt đầu tuần vào",
            week_start_desc: "Ngày đầu tiên hiển thị trong mỗi hàng tuần",
        },
        fav_calendars: {
            title: "Duyệt qua lịch yêu thích",
            vn_holidays: "Ngày lễ ở Việt Nam",
            vn_holidays_desc: "Tết Nguyên Đán, 30/4, 2/9 và các ngày lễ quốc gia",
            world_holidays: "Ngày lễ thế giới",
            world_holidays_desc: "Giáng sinh, Tết Dương Lịch, Halloween...",
            other_holidays: "Ngày lễ khác",
            other_holidays_desc: "Ngày lễ của các tôn giáo và văn hóa khác",
            custom_title: "Thêm các ngày lễ tuỳ chỉnh",
            custom_desc: "Thêm ngày lễ riêng của bạn để hiển thị trên lịch",
            custom_placeholder: "VD: Ngày thành lập công ty...",
            add: "Thêm",
            no_custom: "Chưa có ngày lễ tuỳ chỉnh nào",
        },
        categories_settings: {
            title: "Quản lý danh mục lịch",
            add_title: "Thêm danh mục mới",
            add_desc: "Tạo thêm các danh mục để phân loại sự kiện của bạn (VD: Học tập, Gym, ...)",
            placeholder: "Tên danh mục mới...",
        },
    },
    en: {
        // Sidebar
        app_name: "My Calendar",
        create: "Create",
        my_calendars: "My Calendars",
        event: "Event",
        task: "Task",
        appointment: "Appointment",
        my_calendars_title: "My Calendars",
        holidays_title: "Holidays",
        creating: "Creating...",
        deadline_hit: "Deadline hit",
        all_day: "All day",
        no_events_day: "No events scheduled for this day",
        mini_calendar: {
            days: {
                monday: "M",
                tuesday: "T",
                wednesday: "W",
                thursday: "T",
                friday: "F",
                saturday: "S",
                sunday: "S"
            }
        },
        year_day_popup: {
            no_events: "No events scheduled",
            all_day: "All day"
        },
        categories: {
            default: "Default",
            work: "Work",
            family: "Family",
            personal: "Personal",
        },
        // Header
        today: "Today",
        notifications: "Notifications",
        no_notifications: "No new notifications",
        mark_all_read: "Mark all as read",
        view_all_notifications: "View all notifications",
        settings: "Settings",
        settings_desc: "Customize your calendar",
        trash: "Trash",
        // Views
        view_day: "Day",
        view_week: "Week",
        view_month: "Month",
        view_year: "Year",
        // System
        system: "System",
        upcoming_start: "Starting in %s minutes",
        save_settings: "Save Settings",
        cancel: "Cancel",
        saved: "Saved",

        // Settings Modal
        sections: {
            language: "Language & Region",
            timezone: "Timezone",
            events: "Event Settings",
            notifications: "Notifications",
            view: "View Options",
            calendars: "Favorite Calendars",
            categories: "Category Management",
            active_calendars: "Active Calendars",
            category_list: "Category List",
        },
        lang_region: {
            title: "Language and Region",
            language: "Language",
            language_desc: "Language used across the application",
            country: "Country",
            country_desc: "Your country or region",
            date_format: "Date Format",
            date_format_desc: "How dates, months, and years are displayed",
            time_format: "Time Format",
            time_format_desc: "Display time in 12-hour or 24-hour style",
            hour_12: "12 hours",
            hour_24: "24 hours",
        },
        timezone: {
            title: "Timezone",
            show_secondary: "Show secondary timezone",
            show_secondary_desc: "Add a second timezone column to the grid",
            primary: "Primary Timezone",
            primary_desc: "Your default timezone",
            secondary: "Secondary Timezone",
            secondary_desc: "Second timezone displayed alongside",
            secondary_disabled: "Enable the option above to use this feature",
        },
        event_settings: {
            title: "Event Settings",
            meet_link: "Default Meet link",
            meet_link_desc: "Automatically filled for every new event",
            location: "Default Location",
            location_desc: "Pre-filled location when creating events",
            location_placeholder: "Enter location...",
        },
        notif_settings: {
            title: "Notification Settings",
            type: "Notification Type",
            off: "Off",
            off_desc: "Do not receive any notifications",
            screen: "On-screen notifications",
            screen_desc: "Show popups within the application",
            push: "Push notifications",
            push_desc: "Browser / system level notifications",
            reminder: "Advance reminder",
            reminder_desc: "Minutes to notify before the event starts",
            minutes: "minutes",
        },
        view_options: {
            title: "View Options",
            show_weekends: "Show weekends",
            show_weekends_desc: "Show Saturday and Sunday on the grid",
            show_completed: "Show completed tasks",
            show_completed_desc: "Tasks marked as done still appear on calendar",
            show_week_num: "Show week numbers",
            show_week_num_desc: "Week order in the year (1–52)",
            dim_past: "Dim past events",
            dim_past_desc: "Slightly fade past events to distinguish them",
            week_start: "Week starts on",
            week_start_desc: "The first day displayed in each week row",
        },
        fav_calendars: {
            title: "Browse Favorite Calendars",
            vn_holidays: "Vietnam Holidays",
            vn_holidays_desc: "Lunar New Year, Apr 30, Sep 2 and national holidays",
            world_holidays: "World Holidays",
            world_holidays_desc: "Christmas, New Year, Halloween...",
            other_holidays: "Other Holidays",
            other_holidays_desc: "Religious and cultural holidays",
            custom_title: "Add Custom Holidays",
            custom_desc: "Add your own holidays to show on the calendar",
            custom_placeholder: "e.g. Company Anniversary...",
            add: "Add",
            no_custom: "No custom holidays yet",
        },
        categories_settings: {
            title: "Manage Calendar Categories",
            add_title: "Add New Category",
            add_desc: "Create new categories to classify your events (e.g., Study, Gym, ...)",
            placeholder: "New category name...",
        },

        loading: "Loading...",
        error: "Error",
        retry: "Retry",
        delete: "Delete",
        deleting: "Deleting...",
        save: "Save",
        saving: "Saving...",
        update: "Update",
        search: "Search",
        common: {
            close: "Close",
            add: "Add",
            cancel: "Cancel",
            save: "Save",
            update: "Update",
            delete: "Delete",
        },

        // User Menu
        user: {
            welcome: "Welcome",
            login: "Login",
            register: "Register",
            logout: "Logout",
            login_required: "Please login",
        },

        // Right Sidebar
        sidebar_tools: {
            tasks: "Google Tasks",
            keep: "Google Keep",
            maps: "Google Maps",
            contacts: "Contacts",
        },

        // Panels
        contacts_panel: {
            title: "Contacts",
            search_placeholder: "Search contacts...",
            no_contacts: "No contacts yet",
            not_found: "No contacts found",
            details: "Contact Details",
            message: "Message",
            phone: "Phone",
            email: "Email",
            loading_error: "Could not load contacts.",
            contact_label: "Contact",
            tabs: {
                not_connected: "Not Connected",
                connected: "Connected",
                invitations: "Invitations",
            },
            search_user_placeholder: "Enter user email...",
            connect_btn: "Connect",
            accept_btn: "Accept",
            decline_btn: "Decline",
            no_results: "User not found",
            no_invitations: "No invitations yet",
            request_sent: "Request sent",
            unfriend: "Unfriend",
            block: "Block",
            pin: "Pin",
            unpin: "Unpin",
            guests: "Guests",
            add_guest: "Add Guest",
            permission: "Permission",
            can_edit: "Can Edit",
            view_only: "View Only",
            owned_by: "Created by",
            leave_event: "Leave Event",
            collision_warning: "This event overlaps with your existing schedule. Still accept?",
            collision_found: "Schedule Conflict",
            no_notifications: "No new notifications",
            invitation_msg: "%s invited you to event: %s",
        },
        keep_panel: {
            new_note: "New Note",
            title_placeholder: "Title",
            content_placeholder: "Take a note...",
            pinned: "Pinned",
            other: "Others",
            no_notes: "No notes yet",
            default_title: "New Note",
        },
        maps_panel: {
            search_placeholder: "Search for a place...",
            open_in_maps: "Open in Google Maps",
        },
        create_modal: {
            confirm_trash: "Are you sure you want to move this to trash?",
            save_error: "Error saving: %s",
            delete_error: "Error deleting: %s",
        },
    }
};

/**
 * Lấy chuỗi dịch theo key và ngôn ngữ
 */
export function t(key, lang = "vi", params = []) {
    const keys = key.split('.');
    let result = TRANSLATIONS[lang] || TRANSLATIONS.vi;
    
    for (const k of keys) {
        if (result[k] === undefined) return key;
        result = result[k];
    }
    
    if (typeof result !== "string") return key;
    
    // Replace %s params
    let formatted = result;
    params.forEach(p => {
        formatted = formatted.replace('%s', p);
    });
    
    return formatted;
}
