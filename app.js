const settings = JSON.parse(localStorage.getItem('settings')) || {
    airsoft: 7000,
    lasertag: 5000,
    paintball: 8500,
    mags: 1200,
    grenades: 1000,
    balls: 1000,
    rent: 7000,
    own: 2000,
    drive: 4500,
    uniform: 3000,
    bdtOwn: 500,
    bdtRent: 3000,
    bbqHours: 6000
};

function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.querySelector(`nav button[onclick="showTab('${tab}')"]`).classList.add('active');
    if (tab === 'history') renderHistory();
}

function saveSettings() {
    ['airsoft', 'lasertag', 'paintball', 'mags', 'grenades', 'balls', 'rent', 'own', 'drive', 'uniform', 'bdtOwn', 'bdtRent', 'bbqHours']
        .forEach(id => settings[id] = +getValue('price_' + id));
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Настройки сохранены');
}

function updateFields() {
    const game = document.getElementById('game').value;
    const all = ['players', 'mags', 'grenades', 'balls', 'rent', 'own', 'driveRent', 'uniformRentAirsoft', 'bdtOwn', 'bdtRent', 'bbqHours'];
    all.forEach(id => document.getElementById(id).parentElement.classList.add('hidden'));
    document.getElementById('prepay').checked = true;
    document.getElementById('prepay').parentElement.classList.remove('hidden');
    if (game === 'airsoft') ['players', 'mags', 'grenades', 'driveRent', 'uniformRentAirsoft', 'bbqHours'].forEach(show);
    if (game === 'lasertag') ['players', 'bbqHours'].forEach(show);
    if (game === 'paintball') ['players', 'grenades', 'balls', 'bbqHours'].forEach(show);
    if (game === 'open') {
        ['mags', 'grenades', 'rent', 'own', 'driveRent', 'uniformRentAirsoft', 'bdtOwn', 'bdtRent'].forEach(show);
        document.getElementById('prepay').checked = false;
        document.getElementById('prepay').parentElement.classList.add('hidden');
    }
    function show(id) { document.getElementById(id).parentElement.classList.remove('hidden'); }
}

function generateReceipt() {
    const names = {
        airsoft: 'Страйкбол',
        lasertag: 'Лазертаг',
        paintball: 'Пейнтбол',
        open: 'Страйкбол (открытая)'
    };
    const game = document.getElementById('game').value;
    const rawDate = new Date(document.getElementById('datetime').value);
    const datetime = rawDate.toLocaleDateString('ru-RU').replace(/\//g, '.') + ' / ' +
                rawDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const prepay = document.getElementById('prepay').checked ? 10000 : 0;
    const players = +getValue('players');
    const mags = +getValue('mags');
    const grenades = +getValue('grenades');
    const balls = +getValue('balls');
    const rent = +getValue('rent');
    const own = +getValue('own');
    const drive = +getValue('driveRent');
    const uniform = +getValue('uniformRentAirsoft');
    const bdtOwn = +getValue('bdtOwn');
    const bdtRent = +getValue('bdtRent');
    const bbqHours = +getValue('bbqHours');
    const cash = +getValue('cash');
    const pay = +getValue('pay');
    const comment = document.getElementById('comment').value;
    let total = 0;
    if (game === 'airsoft') total += players * settings.airsoft;
    if (game === 'lasertag') total += players * settings.lasertag;
    if (game === 'paintball') total += players * settings.paintball;
    total += mags * settings.mags + grenades * settings.grenades + balls * settings.balls + rent * settings.rent;
    total += own * settings.own + drive * settings.drive + uniform * settings.uniform;
    total += bdtOwn * settings.bdtOwn + bdtRent * settings.bdtRent + bbqHours * settings.bbqHours;

    let receipt = `1. Игра: ${names[game] || ''}\n2. Дата/время: ${datetime}\n`;

    if (game === 'open') {
        receipt += `3. Количество игроков:\nАренда - ${rent} (${rent * settings.rent})\nСо своим - ${own} (${own * settings.own})\nАренда привода - ${drive} (${drive * settings.drive})\nАренда формы - ${uniform} (${uniform * settings.uniform})\nБДТ со своим - ${bdtOwn} (${bdtOwn * settings.bdtOwn})\nБДТ аренда - ${bdtRent} (${bdtRent * settings.bdtRent})\n`;
    } else {
        receipt += `3. Количество игроков: ${players} (${players * (settings[game] || 0)})\n`;
    }

    if (game === 'paintball' && balls) {
        receipt += `4. Магазины: ${balls}x50 (${balls * settings.balls})\n`;
    } else {
        receipt += `4. Магазины: ${mags} (${mags * settings.mags})\n`;
    }

    receipt += `5. Гранаты: ${grenades} (${grenades * settings.grenades})\n`;
    receipt += `6. Предоплата: ${prepay || 0}\n`;
    receipt += `7. Именинник: -\n8. Итого: ${total}\n9. Без предоплаты: ${total - prepay}\n10. Комментарии:\n${comment}\n`;
    if (bbqHours > 0) {
        total += bbqHours * 6000;
        receipt += `Дополнительно: Мангалка - ${bbqHours}ч (${bbqHours * 6000})\n\nОплата наличными: ${cash}\nОплата через Pay: ${pay}`;
    }
    document.getElementById('receipt').innerText = receipt;
}

function copyReceipt() {
    const receiptText = document.getElementById('receipt').innerText;
    navigator.clipboard.writeText(receiptText).then(() => {
        alert('Чек скопирован!');
    });
}

function saveToHistory() {
    const receiptText = document.getElementById('receipt').innerText;
    if (!receiptText) return alert('Сначала сформируй ведомость');

    const isPrepay = document.getElementById('prepay').checked;

    const rawDate = new Date(document.getElementById('datetime').value);
    const datetime = rawDate.toLocaleDateString('ru-RU').replace(/\//g, '.') + ' / ' +
                    rawDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const totalMatch = /Итого:\s*(\d+)/.exec(receiptText);
    const noPrepayMatch = /Без предоплаты:\s*(\d+)/.exec(receiptText);
    const total = totalMatch ? Number(totalMatch[1]) : 0;
    const noPrepay = noPrepayMatch ? Number(noPrepayMatch[1]) : 0;

    const game = document.getElementById('game').value;
    const cash = +getValue('cash');
    const pay = +getValue('pay');

    const history = JSON.parse(localStorage.getItem('history') || '[]');
    history.push({
        datetime,
        game,
        total: `${total} / ${noPrepay}`,
        receipt: receiptText,
        payment: `Наличные: ${cash} / Pay: ${pay}`,
        prepay: isPrepay ? 'Да' : 'Нет'
    });
    localStorage.setItem('history', JSON.stringify(history));
    alert('Сохранено в историю');
}




function renderHistory() {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    const names = {
        airsoft: 'Страйкбол',
        lasertag: 'Лазертаг',
        paintball: 'Пейнтбол',
        open: 'Страйкбол (открытая)'
    };
    history.forEach((h, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${h.datetime}</td><td>${names[h.game]}</td><td>${h.total}</td><td>${h.prepay || 'Нет данных'}</td><td>${h.payment}</td>`;
        tbody.appendChild(tr);
    });
}

function clearHistory() {
    if (confirm('Удалить всю историю?')) {
        localStorage.removeItem('history');
        renderHistory();
    }
}

function getValue(id) {
    return document.getElementById(id) ? document.getElementById(id).value : 0;
}

function clearForm() {
    const ids = [
        'players', 'mags', 'grenades', 'balls', 'rent', 'own',
        'driveRent', 'uniformRentAirsoft', 'bdtOwn', 'bdtRent', 'bbqHours',
        'cash', 'pay', 'datetime', 'comment'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        }
    });
    document.getElementById('receipt').innerText = '';
}

