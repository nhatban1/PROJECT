	function showToast(message, type = 'info', timeout = 3000) {
		const id = 'app-toast-root';
		let root = document.getElementById(id);
		if (!root) {
			root = document.createElement('div');
			root.id = id;
			root.style.position = 'fixed';
			root.style.right = '16px';
			root.style.top = '16px';
			root.style.zIndex = 9999;
			document.body.appendChild(root);
		}
		const el = document.createElement('div');
		el.className = `toast toast-${type}`;
		el.textContent = message;
		el.style.marginTop = '8px';
		el.style.padding = '8px 12px';
		el.style.background = type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#333';
		el.style.color = '#fff';
		el.style.borderRadius = '4px';
		root.appendChild(el);
		setTimeout(() => el.remove(), timeout);
	}

	if (typeof window !== 'undefined') window.showToast = showToast;

    