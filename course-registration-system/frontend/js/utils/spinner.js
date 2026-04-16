function showSpinner() {
	let s = document.getElementById('app-spinner');
	if (!s) {
		s = document.createElement('div');
		s.id = 'app-spinner';
		s.style.position = 'fixed';
		s.style.left = 0;
		s.style.top = 0;
		s.style.right = 0;
		s.style.bottom = 0;
		s.style.display = 'flex';
		s.style.alignItems = 'center';
		s.style.justifyContent = 'center';
		s.style.background = 'rgba(0,0,0,0.3)';
		s.innerHTML = '<div style="padding:12px;background:#fff;border-radius:6px">Loading...</div>';
		document.body.appendChild(s);
	}
}

function hideSpinner() {
	const s = document.getElementById('app-spinner');
	if (s) s.remove();
}

if (typeof window !== 'undefined') { window.showSpinner = showSpinner; window.hideSpinner = hideSpinner; }
