# Pico Station UI

Легкий статический интерфейс для панели станции на Raspberry Pi Pico 2W / MicroPython.

## Что внутри

- `index.html` — один экран станции без внешних зависимостей.
- `app.css` — светлая и темная neumorphism-темы на CSS-переменных.
- `app.js` — крутилка крена, SVG-график с интерактивными точками и переключением метрик, динамическая таблица, карточки телеметрии, питание, настройки и редактирование названия долгим нажатием.
- Настройки темы, названия, жирности текста и контраста сохраняются в `localStorage` браузера.
- Крутилка поддерживает режимы `read-only` и ручного управления: `window.PicoStationUI.setDialReadOnly(true|false)`.
- Альтернативно можно отправить DOM-событие: `document.dispatchEvent(new CustomEvent("pico:set-dial-read-only", { detail: { readOnly: false } }))`.
- Видимость подписей, подпись нижней оси и набор столбцов таблицы описаны в `COMPONENTS.md`.

Документация для переноса компонентов в другие проекты: [`COMPONENTS.md`](COMPONENTS.md).

## Ожидаемые API

Интерфейс работает и без API, используя демо-данные. Для Pico можно добавить эти эндпоинты:

```http
GET /api/state
```

```json
{
  "angle": 12,
  "temp": 24.1,
  "wifi": -54,
  "voltage": 5.04,
  "power": true,
  "connected": true,
  "dialReadOnly": true,
  "showDialLabel": true,
  "showSensorSource": false,
  "showChartTitle": true,
  "showYAxisTitle": false,
  "chartXTitle": "Глубина, м",
  "profile": {
    "x": [0, 5, 10, 15],
    "height": [0, 2.6, 6.4, 10.2],
    "angle": [-8, -3, 5, 12],
    "temp": [22.8, 23.0, 23.3, 23.7]
  }
}
```

```http
POST /api/power
{"power": true}
```

```http
POST /api/roll
{"angle": 12}
```

`POST /api/roll` нужен только когда крутилка переведена в ручной режим.

## Как класть на Pico

1. Скопировать `index.html`, `app.css`, `app.js` в каталог статики прошивки, например `/www`.
2. В MicroPython отдавать эти файлы как обычный HTTP-ответ.
3. Для экономии памяти не собирать HTML строками в рантайме, а читать файл чанками.
4. Обновлять данные не чаще, чем нужно. Сейчас интерфейс опрашивает `/api/state` раз в 3 секунды.

Для iOS удобно запускать Pico 2W как точку доступа или подключать его в ту же сеть, а страницу открывать в Safari. Интерфейс не использует CDN, web fonts, PNG и тяжелые CSS-фильтры.
