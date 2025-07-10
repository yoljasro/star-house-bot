// starhouse-bot.js
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const forwardBotToken = process.env.FORWARD_BOT_TOKEN;
const forwardChatId = process.env.FORWARD_CHAT_ID;

const userState = new Map();

const langs = {
  uz: {
    start: 'Tilni tanlang:',
    view: '🏠 Xonadonlarni ko‘rish',
    applyVisit: '📅 Ko‘rishga yozilish',
    address: '📍 Offis manzili',
    promo: '🎉 Aksiyalar',
    back: '🏠 Bosh menyu',
    enterName: '👤 Ismingizni kiriting:',
    enterPhone: '📞 Telefon raqamingizni kiriting:',
    accepted: '✅ Maʼlumotlar qabul qilindi. Tez orada siz bilan bog‘lanamiz.',
    locationText: '📍 Manzil: Tashkent, Chilonzor tumani, Star House ofisi',
    promoText: `🎉 Aksiyalar:\n💵 Naqd to‘lovda: 15% chegirma\n💳 50% oldindan to‘lovda: 10% chegirma`,
    selectPlanInfo: 'ℹ️ Oylar soni bo‘yicha moslashuv (cho‘zish yoki qisqartirish) imkoniyati mavjud. Batafsil maʼlumot uchun ofisimizga tashrif buyuring.',
    apartmentList: '🏠 Qaysi xonadon turini ko‘rmoqchisiz?',
    applyNow: '📝 Yozilish'
  },
  ru: {
    start: 'Выберите язык:',
    view: '🏠 Просмотреть квартиры',
    applyVisit: '📅 Записаться на просмотр',
    address: '📍 Адрес офиса',
    promo: '🎉 Акции',
    back: '🏠 Главное меню',
    enterName: '👤 Введите ваше имя:',
    enterPhone: '📞 Введите ваш номер телефона:',
    accepted: '✅ Данные приняты. Мы скоро с вами свяжемся.',
    locationText: '📍 Адрес: Ташкент, район Чилонзор, офис Star House',
    promoText: `🎉 Акции:\n💵 При оплате наличными: скидка 15%\n💳 При предоплате 50%: скидка 10%`,
    selectPlanInfo: 'ℹ️ Возможна корректировка срока рассрочки (увеличение/уменьшение). Подробности в нашем офисе.',
    apartmentList: '🏠 Какой тип квартиры хотите просмотреть?',
    applyNow: '📝 Оставить заявку'
  }
};

const apartments = {
  uz: {
    '1 xonali (39.4m²)': {
      type: '1 xonali (39.4m²)', size: 39.4, total: 393606000, prepay: 118081800, rest: 275524200, months: 30, monthly: 9184140
    },
    '1 xonali (44.2m²)': {
      type: '1 xonali (44.2m²)', size: 44.2, total: 441558000, prepay: 132467400, rest: 309090600, months: 30, monthly: 10303020
    },
    '2 xonali (62.4m²)': {
      type: '2 xonali (62.4m²)', size: 62.4, total: 623376000, prepay: 187012800, rest: 436363200, months: 36, monthly: 12121200
    },
    '3 xonali (85.7m²)': {
      type: '3 xonali (85.7m²)', size: 85.7, total: 856143000, prepay: 256842900, rest: 599300100, months: 48, monthly: 12485419
    }
  },
  ru: {
    '1-комнатная (39.4м²)': {
      type: '1-комнатная (39.4м²)', size: 39.4, total: 393606000, prepay: 118081800, rest: 275524200, months: 30, monthly: 9184140
    },
    '1-комнатная (44.2м²)': {
      type: '1-комнатная (44.2м²)', size: 44.2, total: 441558000, prepay: 132467400, rest: 309090600, months: 30, monthly: 10303020
    },
    '2-комнатная (62.4м²)': {
      type: '2-комнатная (62.4м²)', size: 62.4, total: 623376000, prepay: 187012800, rest: 436363200, months: 36, monthly: 12121200
    },
    '3-комнатная (85.7м²)': {
      type: '3-комнатная (85.7м²)', size: 85.7, total: 856143000, prepay: 256842900, rest: 599300100, months: 48, monthly: 12485419
    }
  }
};

function showLangMenu(chatId) {
  userState.set(chatId, {});
  bot.sendMessage(chatId, 'Tilni tanlang / Выберите язык:', {
    reply_markup: {
      keyboard: [['🇺🇿 Oʻzbek', '🇷🇺 Русский']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

function showMainMenu(chatId, lang) {
  const t = langs[lang];
  userState.set(chatId, { lang });
  bot.sendMessage(chatId, t.start, {
    reply_markup: {
      keyboard: [[t.view, t.applyVisit], [t.address, t.promo]],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

bot.onText(/\/start/, (msg) => {
  showLangMenu(msg.chat.id);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userState.get(chatId) || {};

  if (text === '🇺🇿 Oʻzbek') return showMainMenu(chatId, 'uz');
  if (text === '🇷🇺 Русский') return showMainMenu(chatId, 'ru');

  const lang = state.lang || 'uz';
  const t = langs[lang];

  if (text === t.back) return showMainMenu(chatId, lang);
  if (text === t.view) {
    state.step = 'selecting_apartment';
    userState.set(chatId, state);
    return bot.sendMessage(chatId, t.apartmentList, {
      reply_markup: {
        inline_keyboard: Object.keys(apartments[lang]).map(type => [
          { text: type, callback_data: `apartment:${type}` }
        ])
      }
    });
  }
  if (text === t.applyVisit) {
    state.step = 'visit_name';
    userState.set(chatId, state);
    return bot.sendMessage(chatId, t.enterName);
  }
  if (text === t.address) {
    bot.sendLocation(chatId, 41.228404, 69.232521);
    return bot.sendMessage(chatId, t.locationText, {
      reply_markup: {
        keyboard: [[t.back]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }
  if (text === t.promo) {
    state.step = 'promo_name';
    userState.set(chatId, state);
    bot.sendMessage(chatId, t.promoText);
    return bot.sendMessage(chatId, t.enterName);
  }

  if (['visit_name', 'promo_name', 'apartment_name'].includes(state.step)) {
    state.name = text;
    state.step = 'collect_phone';
    userState.set(chatId, state);
    return bot.sendMessage(chatId, t.enterPhone);
  }

  if (state.step === 'collect_phone') {
    state.phone = text;
    state.step = null;
    userState.set(chatId, state);

    const summary = `📥 Yangi so‘rov:\n👤 ${state.name}\n📞 ${state.phone}\n${state.selection ? `🏠 ${state.selection}` : ''}`;

    bot.sendMessage(chatId, t.accepted, {
      reply_markup: {
        keyboard: [[t.back]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });

    const forwardBot = new TelegramBot(forwardBotToken);
    forwardBot.sendMessage(forwardChatId, summary);
  }
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const state = userState.get(chatId) || {};
  const lang = state.lang || 'uz';
  const t = langs[lang];
  const selectedApartments = apartments[lang];

  if (data.startsWith('apartment:')) {
    const type = data.split(':')[1];
    const info = selectedApartments[type];

    const message = `🏠 ${info.type}\n` +
      `📐 ${info.size} м²\n` +
      `💰 ${info.total.toLocaleString()} ${lang === 'ru' ? 'сум' : 'so‘m'}\n` +
      `🧾 30%: ${info.prepay.toLocaleString()} ${lang === 'ru' ? 'сум' : 'so‘m'}\n` +
      `💸 ${lang === 'ru' ? 'Остаток' : 'Qolgan'}: ${info.rest.toLocaleString()} ${lang === 'ru' ? 'сум' : 'so‘m'}\n` +
      `📆 ${lang === 'ru' ? `в рассрочку на ${info.months} мес: ${info.monthly.toLocaleString()} сум/мес` : `${info.months} oyga: ${info.monthly.toLocaleString()} so‘m/oy`}\n\n` +
      `${t.selectPlanInfo}\n\n${t.promoText}`;

    return bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [[{ text: t.applyNow, callback_data: `plan:${type}` }]]
      }
    });
  }

  if (data.startsWith('plan:')) {
    const type = data.split(':')[1];
    const info = selectedApartments[type];

    state.selection = `${info.type}, ${info.months} ${lang === 'ru' ? 'мес' : 'oy'} - ${info.monthly.toLocaleString()} ${lang === 'ru' ? 'сум/мес' : 'so‘m/oy'}`;
    state.step = 'apartment_name';
    userState.set(chatId, state);

    return bot.sendMessage(chatId, t.enterName);
  }
});
