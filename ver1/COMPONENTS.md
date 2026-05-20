# Pico Station UI Kit

Этот проект устроен как набор легких графических элементов для веб-панелей на Pico 2W / Zero 2W, а не как жестко связанное веб-приложение.

## Компоненты

### Roll Dial

Индикатор крена по продольной оси. По умолчанию работает как `read-only` виджет датчика.

Плейсхолдер данных для прошивки: `A1`. Интерфейс также принимает читаемый алиас `angle`.

```js
window.PicoStationUI.setDialReadOnly(true);
window.PicoStationUI.setDialReadOnly(false);
```

DOM-вариант для встраивания:

```js
document.dispatchEvent(
  new CustomEvent("pico:set-dial-read-only", {
    detail: { readOnly: false }
  })
);
```

В ручном режиме крутилка отправляет:

```http
POST /api/roll
{"angle": 12.4}
```

Угол отображается в градусах и угловых минутах: `12°24′`.

Подпись под стрелкой можно включать и выключать:

```js
window.PicoStationUI.setDialLabelVisible(true);
window.PicoStationUI.setDialLabelVisible(false);
```

Плашка источника данных скрыта по умолчанию. Ее можно включить, если нужно явно показать источник сенсора:

```js
window.PicoStationUI.setSensorSourceVisible(true);
```

### Profile Chart

SVG-график профиля с осью `X, м` и переключаемой осью `Y`.

Метрики:

- `height` — высота, м
- `angle` — угол, градусы
- `temp` — температура, °C

Переключение:

```js
window.PicoStationUI.setMetric("height");
window.PicoStationUI.setMetric("angle");
window.PicoStationUI.setMetric("temp");
```

DOM-вариант:

```js
document.dispatchEvent(
  new CustomEvent("pico:set-metric", {
    detail: { metric: "temp" }
  })
);
```

Заголовок блока, подпись оси Y и подпись нижней оси настраиваются:

```js
window.PicoStationUI.setChartTitleVisible(false);
window.PicoStationUI.setYAxisTitleVisible(false);
window.PicoStationUI.setChartXTitle("Глубина, м");
```

Точки графика интерактивные: на касание, клик или фокус появляется подпись с координатой и значением выбранной метрики.
По умолчанию подпись точки скрыта и появляется только после явного касания/клика по графику.

### Tilt Angle

Угол наклона показывается внутри циферблата вместо нижней подписи. Плейсхолдер данных для прошивки: `A0`.
Отдельная плашка `tiltPanel` оставлена в шаблоне, но выключена по умолчанию.

```js
window.PicoStationUI.setInclineAngle(3.7);
```

### Measure Button

Главная кнопка замера стоит между углом наклона и графиком. Цвет можно задавать прямо атрибутом:

```html
<button class="measure-button" data-color="#ff865c">Замер</button>
```

Или менять из JS/API:

```js
window.PicoStationUI.setMeasureButtonColor("#2fb8ff");
window.PicoStationUI.measure();
```

Нажатие отправляет:

```http
POST /api/measure
{"measure": true}
```

### Data Table

Таблица строится из тех же массивов, что и график. По умолчанию выводятся все строки, переданные в `profile`. Набор столбцов можно менять под тип станции:

```js
window.PicoStationUI.setTableColumns([
  { "key": "index", "label": "Точка" },
  { "key": "x", "label": "Глубина", "digits": 0 },
  { "key": "angle", "label": "Крен", "type": "angle" },
  { "key": "temp", "label": "Темп.", "digits": 1, "suffix": "°" }
]);
```

Встроенные столбцы:

- номер точки
- `X, м`
- `H, м`
- угол
- температура

Если пользователь прокручивает длинную таблицу вниз, появляется кнопка возврата наверх.

### Info Tiles

Компактные информационные блоки для питания, температуры, Wi-Fi и напряжения.

Иконка сигнала окрашивается от синего до красного по уровню `wifi` в dBm. Если страница уже открыта, но `/api/state` перестал отвечать, сигнал переходит в перечеркнутый режим. Если сама страница не загрузилась с устройства, браузер, конечно, не сможет показать состояние дисконнекта.

Нижние блоки можно включать и выключать как шаблонные элементы:

```js
window.PicoStationUI.setPanelVisibility({
  infoGrid: true,
  tiltPanel: false,
  measureButton: true,
  infoTiles: {
    power: true,
    temperature: true,
    signal: true,
    voltage: true
  },
  powerPanel: true,
  tablePanel: true
});
```

Те же флаги можно отдавать из `/api/state` в поле `panels` или `visiblePanels`.

### Experiment HUD

Верхняя и боковая плашки показывают короткие параметры эксперимента:

- `B` — батарея станции
- `P` — питание/напряжение зонда, при отключении выводит `--`
- `Ts` — температура станции
- `Tp` — температура зонда
- `Mem` — свободная память в количестве замеров
- точка связи — синяя при соединении, красная при потере связи

Управление видимостью:

```js
window.PicoStationUI.setExperimentHudOptions({
  topVisible: true,
  sideVisible: false,
  items: {
    battery: true,
    probeVoltage: true,
    stationTemp: true,
    probeTemp: true,
    memory: true,
    link: true
  }
});
```

Тумблер зонда в шапке отправляет:

```http
POST /api/probe-power
{"probePower": true}
```

При выключении зонда интерфейс сначала показывает подтверждение, чтобы случайное касание не остановило текущий замер.

### Landscape Mode

В landscape на телефоне интерфейс автоматически переключается в двухколоночный режим: верхний HUD скрывается, боковой HUD включается, левая часть сохраняет размер приборов, а график и кнопка `Замер` занимают правую область экрана.

### Settings Sheet

Нижняя панель настроек:

- темная тема
- название станции
- жирность текста
- контраст текста

Значения сохраняются в `localStorage` браузера.

## State Payload

Рекомендуемый ответ Pico:

```json
{
  "angle": 12.4,
  "temp": 24.1,
  "wifi": -54,
  "voltage": 5.04,
  "power": true,
  "probePower": true,
  "A1": 12.4,
  "A0": 3.7,
  "battery": 4.12,
  "probeVoltage": 13.02,
  "stationTemp": 12.1,
  "probeTemp": 8.1,
  "memoryFree": 399,
  "measureButtonColor": "#ff865c",
  "connected": true,
  "dialReadOnly": true,
  "showDialLabel": true,
  "showSensorSource": false,
  "showChartTitle": true,
  "showYAxisTitle": false,
  "chartXTitle": "Глубина, м",
  "experimentHud": {
    "topVisible": true,
    "sideVisible": true
  },
  "panels": {
    "infoGrid": true,
    "tiltPanel": false,
    "measureButton": true,
    "infoTiles": {
      "power": true,
      "temperature": true,
      "signal": true,
      "voltage": true
    },
    "powerPanel": true,
    "tablePanel": true
  },
  "profile": {
    "x": [0, 5, 10, 15],
    "height": [0, 2.6, 6.4, 10.2],
    "angle": [-8.2, -3.5, 5.1, 12.4],
    "temp": [22.8, 23.0, 23.3, 23.7]
  }
}
```

Все массивы в `profile` должны быть одинаковой длины. Интерфейс оставляет последние 24 точки для графика и последние 5 точек для таблицы.

## Минимизация для Pico

Перед прошивкой можно минифицировать `index.html`, `app.css`, `app.js`, но исходники лучше хранить читаемыми. На MicroPython выгоднее отдавать файлы чанками из flash, а не собирать HTML строками в памяти.
