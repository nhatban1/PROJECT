function renderPagination(containerSelector, currentPage, totalItems, perPage, onPage) {
	const container = document.querySelector(containerSelector);
	if (!container) return;
	const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
	let html = '';
	for (let p = 1; p <= totalPages; p++) {
		html += `<button data-page="${p}" class="pg ${p===currentPage? 'active':''}">${p}</button>`;
	}
	container.innerHTML = html;
	container.querySelectorAll('button[data-page]').forEach(btn => btn.addEventListener('click', (e) => {
		const p = Number(e.target.getAttribute('data-page'));
		onPage && onPage(p);
	}));
}

if (typeof window !== 'undefined') window.renderPagination = renderPagination;
