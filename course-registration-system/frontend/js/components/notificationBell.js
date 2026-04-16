// Simple notification bell. Call renderNotificationBell('#notif')
async function renderNotificationBell(selector) {
	const container = document.querySelector(selector);
	if (!container) return;
	try {
		const res = await apiFetch('/notifications');
		const items = res.data || [];
		const unread = items.filter(n => !(n.isRead || []).some(r => r.userId === (res.userId || null))).length;
		container.innerHTML = `
			<button id="notifBtn">🔔 <span id="notifCount">${unread}</span></button>
			<div id="notifList" style="display:none; position:absolute; background:#fff; border:1px solid #ccc; padding:8px;">
				${items.map(n=>`<div class="notif-item"><strong>${n.title||''}</strong><div>${n.message||''}</div></div>`).join('')}
			</div>
		`;
		const btn = container.querySelector('#notifBtn');
		const list = container.querySelector('#notifList');
		btn.addEventListener('click', ()=> list.style.display = list.style.display === 'none' ? 'block' : 'none');
	} catch (e) {
		container.innerHTML = '';
	}
}

if (typeof window !== 'undefined') window.renderNotificationBell = renderNotificationBell;
