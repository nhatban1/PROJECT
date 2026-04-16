function renderSidebar(selector) {
	const container = document.querySelector(selector);
	if (!container) return;
	container.innerHTML = `
		<ul class="sidebar-menu">
			<li><a href="/pages/dashboard.html">Dashboard</a></li>
			<li><a href="/pages/courses.html">Môn học</a></li>
			<li><a href="/pages/teachers.html">Giảng viên</a></li>
			<li><a href="/pages/semesters.html">Học kỳ</a></li>
			<li><a href="/pages/registration.html">Đăng ký</a></li>
			<li><a href="/pages/schedule.html">Lịch</a></li>
		</ul>
	`;
}

if (typeof window !== 'undefined') window.renderSidebar = renderSidebar;
