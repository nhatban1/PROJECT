const modalRootId = 'app-modal-root';

function ensureModalRoot() {
	let root = document.getElementById(modalRootId);
	if (!root) {
		root = document.createElement('div');
		root.id = modalRootId;
		document.body.appendChild(root);
	}
	return root;
}

function openModal(html) {
	const root = ensureModalRoot();
	root.innerHTML = `
		<div class="modal-backdrop" id="modalBackdrop">
			<div class="modal-content">${html}<button id="modalClose">Đóng</button></div>
		</div>
	`;
	root.querySelector('#modalClose').addEventListener('click', closeModal);
}

function closeModal() {
	const root = document.getElementById(modalRootId);
	if (root) root.innerHTML = '';
}

if (typeof window !== 'undefined') {
	window.openModal = openModal;
	window.closeModal = closeModal;
}

