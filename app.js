const defaultSettings = {
    airsoft: 7000,
    lasertag: 5000,
    paintball: 8500,
    mags: 1200,
    grenades: 1200,
    balls: 1000,
    rent: 7000,
    own: 2000,
    drive: 4500,
    uniform: 3000,
    bdtOwn: 500,
    bdtRent: 3000,
    bbqHours: 6000
};

const settingKeys = Object.keys(defaultSettings);
const settings = { ...defaultSettings, ...readStoredSettings() };

document.addEventListener('DOMContentLoaded', () => {
    fillSettingsFields();
    updateFields();
});

function readStoredSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem('settings') || '{}');
        if (!stored || typeof stored !== 'object') return {};

        const preparedSettings = {};
        Object.keys(defaultSettings).forEach(key => {
            const rawValue = stored[key];
            if (rawValue === '' || rawValue === null || rawValue === undefined) return;

            const value = Number(rawValue);
            if (Number.isFinite(value)) preparedSettings[key] = value;
        });

        if (stored.settingsVersion !== 2 && preparedSettings.grenades === 1000) {
            preparedSettings.grenades = defaultSettings.grenades;
        }

        return preparedSettings;
    } catch {
        return {};
    }
}

function showTab(tab) {
    const target = document.getElementById(tab);
    if (!target) return;

    document.querySelectorAll('.tab').forEach(item => item.classList.remove('active'));
    target.classList.add('active');
    document.querySelectorAll('nav button').forEach(button => button.classList.remove('active'));

    const activeButton = document.querySelector(`nav button[onclick="showTab('${tab}')"]`);
    if (activeButton) activeButton.classList.add('active');
}

function saveSettings() {
    for (const id of settingKeys) {
        const input = document.getElementById('price_' + id);
        if (!input) continue;

        const rawValue = input.value.trim();
        if (rawValue === '') continue;

        const value = Number(rawValue);
        if (!Number.isFinite(value) || value < 0) {
            alert('Проверьте цену: значение должно быть числом не меньше 0');
            input.focus();
            return;
        }

        settings[id] = value;
    }

    localStorage.setItem('settings', JSON.stringify({ ...settings, settingsVersion: 2 }));
    fillSettingsFields();
    alert('Настройки сохранены');
}

function resetSettings() {
    if (!confirm('Вернуть стандартные цены?')) return;

    Object.assign(settings, defaultSettings);
    localStorage.setItem('settings', JSON.stringify({ ...settings, settingsVersion: 2 }));
    fillSettingsFields();
    alert('Цены восстановлены');
}

function fillSettingsFields() {
    settingKeys.forEach(id => {
        const input = document.getElementById('price_' + id);
        if (input) input.value = settings[id];
    });
}

function updateFields() {
    const game = document.getElementById('game').value;
    const conditionalFields = [
        'players', 'mags', 'grenades', 'balls', 'rent', 'own',
        'driveRent', 'uniformRentAirsoft', 'bdtOwn', 'bdtRent',
        'birthday', 'bbqHours'
    ];

    conditionalFields.forEach(id => setFieldVisibility(id, false));
    document.getElementById('prepay').checked = true;
    setFieldVisibility('prepay', true);

    if (game === 'airsoft') {
        ['players', 'mags', 'grenades', 'driveRent', 'uniformRentAirsoft', 'own', 'birthday', 'bbqHours'].forEach(showField);
    }

    if (game === 'lasertag') {
        ['players', 'birthday', 'bbqHours'].forEach(showField);
    }

    if (game === 'paintball') {
        ['players', 'grenades', 'balls', 'birthday', 'bbqHours'].forEach(showField);
    }

    if (game === 'open') {
        ['mags', 'grenades', 'rent', 'own', 'driveRent', 'uniformRentAirsoft', 'bdtOwn', 'bdtRent'].forEach(showField);
        document.getElementById('prepay').checked = false;
        document.getElementById('birthday').checked = false;
        setFieldVisibility('prepay', false);
        setFieldVisibility('birthday', false);
    }
}

function showField(id) {
    setFieldVisibility(id, true);
}

function setFieldVisibility(id, isVisible) {
    const element = document.getElementById(id);
    if (element && element.parentElement) {
        element.parentElement.classList.toggle('hidden', !isVisible);
    }
}

function generateReceipt() {
    const names = {
        airsoft: 'Страйкбол',
        lasertag: 'Лазертаг',
        paintball: 'Пейнтбол',
        open: 'Страйкбол (открытая)'
    };

    const game = document.getElementById('game').value;
    if (!game) {
        alert('Выберите игру');
        return;
    }

    const dateValue = document.getElementById('datetime').value;
    const datetime = dateValue ? formatDateTime(dateValue) : '-';
    const hasBirthday = document.getElementById('birthday').checked;
    const prepay = document.getElementById('prepay').checked ? 10000 : 0;
    const players = getNumber('players');
    const mags = ['airsoft', 'open'].includes(game) ? getNumber('mags') : 0;
    const grenades = ['airsoft', 'paintball', 'open'].includes(game) ? getNumber('grenades') : 0;
    const balls = game === 'paintball' ? getNumber('balls') : 0;
    const rent = game === 'open' ? getNumber('rent') : 0;
    const own = ['airsoft', 'open'].includes(game) ? getNumber('own') : 0;
    const drive = ['airsoft', 'open'].includes(game) ? getNumber('driveRent') : 0;
    const uniform = ['airsoft', 'open'].includes(game) ? getNumber('uniformRentAirsoft') : 0;
    const bdtOwn = game === 'open' ? getNumber('bdtOwn') : 0;
    const bdtRent = game === 'open' ? getNumber('bdtRent') : 0;
    const bbqHours = game !== 'open' ? getNumber('bbqHours') : 0;
    const cash = getNumber('cash');
    const pay = getNumber('pay');
    const comment = document.getElementById('comment').value;
    const totalPlayers = hasBirthday && players > 0 ? Math.max(players - 1, 0) : players;
    const extras = [];

    let total = 0;
    let receipt = `1. Игра: ${names[game]}\n2. Дата/время: ${datetime}\n`;

    if (game === 'airsoft') {
        total += totalPlayers * settings.airsoft;
        const rows = [];

        total += addCharge(rows, 'Со своим', own, settings.own);
        total += addCharge(rows, 'Аренда привода', drive, settings.drive);
        total += addCharge(rows, 'Аренда формы', uniform, settings.uniform);

        receipt += `3. Количество игроков: ${players} (${totalPlayers * settings.airsoft})\n`;
        if (rows.length) receipt += `${rows.join('\n')}\n`;
    } else if (game === 'open') {
        const rows = [];

        total += addCharge(rows, 'Аренда', rent, settings.rent);
        total += addCharge(rows, 'Со своим', own, settings.own);
        total += addCharge(rows, 'Аренда привода', drive, settings.drive);
        total += addCharge(rows, 'Аренда формы', uniform, settings.uniform);
        total += addCharge(rows, 'БДТ со своим', bdtOwn, settings.bdtOwn);
        total += addCharge(rows, 'БДТ аренда', bdtRent, settings.bdtRent);

        receipt += rows.length
            ? `3. Количество игроков:\n${rows.join('\n')}\n`
            : '3. Количество игроков: 0 (0)\n';
    } else {
        total += totalPlayers * settings[game];
        receipt += `3. Количество игроков: ${players} (${totalPlayers * settings[game]})\n`;
    }

    total += mags * settings.mags;
    total += grenades * settings.grenades;
    total += balls * settings.balls;
    total += bbqHours * settings.bbqHours;
    if (bbqHours > 0) {
        extras.push(`Дополнительно: Мангалка - ${bbqHours}ч (${bbqHours * settings.bbqHours})`);
    }

    if (game === 'paintball') {
        receipt += `4. Магазины: ${balls}x50 (${balls * settings.balls})\n`;
    } else {
        receipt += `4. Магазины: ${mags} (${mags * settings.mags})\n`;
    }

    receipt += `5. Гранаты: ${grenades} (${grenades * settings.grenades})\n`;
    receipt += `6. Предоплата: ${prepay}\n`;
    receipt += `7. Именинник: ${game !== 'open' && hasBirthday ? 'да' : '-'}\n`;

    receipt += `8. Итого: ${total}\n`;
    receipt += `9. Без предоплаты: ${total - prepay}\n10. Комментарии:\n${comment}\n`;
    if (extras.length) {
        receipt += `\n${extras.join('\n')}\n`;
    }
    receipt += `\nОплата наличными: ${cash}\n`;
    receipt += `Оплата через Pay: ${pay}`;

    document.getElementById('receipt').innerText = receipt;
}

function addCharge(rows, label, count, price) {
    if (count <= 0) return 0;

    const cost = count * price;
    rows.push(`${label} - ${count} (${cost})`);
    return cost;
}

function formatDateTime(value) {
    const rawDate = new Date(value);
    const date = rawDate.toLocaleDateString('ru-RU').replace(/\//g, '.');
    const time = rawDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    return `${date} / ${time}`;
}

function copyReceipt() {
    const receiptText = document.getElementById('receipt').innerText;
    if (!receiptText) {
        alert('Сначала сформируй ведомость');
        return;
    }

    navigator.clipboard.writeText(receiptText).then(() => {
        alert('Чек скопирован!');
    });
}

function getNumber(id) {
    const element = document.getElementById(id);
    if (!element || element.value === '') return 0;

    const value = Number(element.value);
    return Number.isFinite(value) ? value : 0;
}

function clearForm() {
    const ids = [
        'game', 'players', 'mags', 'grenades', 'balls', 'rent', 'own',
        'driveRent', 'uniformRentAirsoft', 'bdtOwn', 'bdtRent', 'bbqHours',
        'cash', 'pay', 'datetime', 'comment'
    ];

    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });

    document.getElementById('birthday').checked = false;
    document.getElementById('prepay').checked = true;
    document.getElementById('receipt').innerText = '';
    updateFields();
}
