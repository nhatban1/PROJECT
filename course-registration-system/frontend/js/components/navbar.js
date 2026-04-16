// Renders a simple navbar. Call renderNavbar('#nav')
async function renderNavbar(selector) {
	const container = document.querySelector(selector);
	if (!container) return;
	let user = null;
	try {
		const res = await apiFetch('/auth/me');
		user = res.data;
	} catch (e) {
		// not logged in
	}

	const links = [];
	if (user && user.role === 'admin') {
		links.push({ href: '/pages/dashboard.html', label: 'Dashboard' });
		links.push({ href: '/pages/courses.html', label: 'Môn học' });
		links.push({ href: '/pages/teachers.html', label: 'Giảng viên' });
		links.push({ href: '/pages/semesters.html', label: 'Học kỳ' });
		links.push({ href: '/pages/students.html', label: 'Sinh viên' });
	} else if (user && user.role === 'student') {
		links.push({ href: '/pages/dashboard.html', label: 'Dashboard' });
		links.push({ href: '/pages/courses.html', label: 'Môn học' });
		links.push({ href: '/pages/registration.html', label: 'Đăng ký' });
		links.push({ href: '/pages/schedule.html', label: 'Lịch' });
	} else {
		links.push({ href: '/pages/login.html', label: 'Đăng nhập' });
	}

	container.innerHTML = `
		<div class="nav-left">
			${links.map(l => `<a href="${l.href}">${l.label}</a>`).join(' | ')}
		</div>
		<div class="nav-right">
			<span id="navUser">${user ? user.fullName || user.email : ''}</span>
			${user ? '<button id="navLogout">Đăng xuất</button>' : ''}
		</div>
	`;

	const logoutBtn = container.querySelector('#navLogout');
	if (logoutBtn) logoutBtn.addEventListener('click', () => { logout(); });
}

if (typeof window !== 'undefined') window.renderNavbar = renderNavbar;
