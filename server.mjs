import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const forwardBotToken = process.env.FORWARD_BOT_TOKEN;
const forwardChatId = process.env.FORWARD_CHAT_ID;

const userState = new Map();

const promotions = `🎉 Aksiyalar:
💵 Naqd to‘lovda: 15% chegirma
💳 50% oldindan to‘lovda: 10% chegirma`;

const apartments = {
  '1 xonali (39.4m²)': {
    size: 39.4,
    total: 393606000,
    prepay: 118081800,
    rest: 275524200,
    months: 30,
    monthly: 9184140
  },
  '1 xonali (44.2m²)': {
    size: 44.2,
    total: 441558000,
    prepay: 132467400,
    rest: 309090600,
    months: 30,
    monthly: 10303020
  },
  '2 xonali (62.4m²)': {
    size: 62.4,
    total: 623376000,
    prepay: 187012800,
    rest: 436363200,
    months: 36,
    monthly: 12121200
  },
  '3 xonali (85.7m²)': {
    size: 85.7,
    total: 856143000,
    prepay: 256842900,
    rest: 599300100,
    months: 48,
    monthly: 12485419
  }
};

function showMainMenu(chatId) {
  userState.set(chatId, {});
  bot.sendMessage(chatId, 'Quyidagi bo‘limlardan birini tanlang:', {
    reply_markup: {
      keyboard: [
        ['🏠 Xonadonlarni ko‘rish', '📅 Ko‘rishga yozilish'],
        ['📍 Offis manzili', '🎉 Aksiyalar']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  showMainMenu(chatId);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userState.get(chatId) || {};

  if (text === '🏠 Bosh menyu') {
    return showMainMenu(chatId);
  }

  if (text === '🏠 Xonadonlarni ko‘rish') {
    state.step = 'selecting_apartment';
    userState.set(chatId, state);
    return bot.sendMessage(chatId, '🏠 Qaysi xonadon turini ko‘rmoqchisiz?', {
      reply_markup: {
        inline_keyboard: Object.keys(apartments).map(type => [
          { text: type, callback_data: `apartment:${type}` }
        ])
      }
    });
  }

  if (text === '📅 Ko‘rishga yozilish') {
    state.step = 'visit_name';
    userState.set(chatId, state);
    return bot.sendMessage(chatId, '👤 Ismingizni kiriting:');
  }

  if (text === '📍 Offis manzili') {
    bot.sendLocation(chatId, 41.228404, 69.232521);
    return bot.sendMessage(chatId, '📍 Manzil: Tashkent, Chilonzor tumani, Star House ofisi', {
      reply_markup: {
        keyboard: [['🏠 Bosh menyu']],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }

  if (text === '🎉 Aksiyalar') {
    state.step = 'promo_name';
    userState.set(chatId, state);
    bot.sendMessage(chatId, promotions);
    return bot.sendMessage(chatId, '📝 Aksiya asosida malumot qoldirish uchun ismingizni kiriting:');
  }

  if (state.step === 'visit_name' || state.step === 'promo_name' || state.step === 'apartment_name') {
    state.name = text;
    state.step = 'collect_phone';
    userState.set(chatId, state);
    return bot.sendMessage(chatId, '📞 Telefon raqamingizni kiriting:');
  }

  if (state.step === 'collect_phone') {
    state.phone = text;
    state.step = null;
    userState.set(chatId, state);

    const summary = `📥 Yangi so‘rov:\n👤 Ism: ${state.name}\n📞 Tel: ${state.phone}\n${state.selection ? `🏠 Tanlangan kvartira: ${state.selection}` : ''}`;

    bot.sendMessage(chatId, '✅ Maʼlumotlar qabul qilindi. Tez orada siz bilan bog‘lanamiz.', {
      reply_markup: {
        keyboard: [['🏠 Bosh menyu']],
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

  if (data.startsWith('apartment:')) {
    const type = data.split(':')[1];
    const info = apartments[type];

    const message = `🏠 ${type}\n📐 Maydoni: ${info.size} m²\n💰 Jami narx: ${info.total.toLocaleString()} so‘m\n🧾 30% boshlang‘ich to‘lov: ${info.prepay.toLocaleString()} so‘m\n💸 Qolgan summa: ${info.rest.toLocaleString()} so‘m\n📆 ${info.months} oyga: ${info.monthly.toLocaleString()} so‘m/oy\n\n${promotions}`;

    return bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [[{ text: '📝 Yozilish', callback_data: `plan:${type}` }]]
      }
    });
  }

  if (data.startsWith('plan:')) {
    const type = data.split(':')[1];
    const info = apartments[type];

    state.selection = `${type}, ${info.months} oy - ${info.monthly.toLocaleString()} so‘m/oy`;
    state.step = 'apartment_name';
    userState.set(chatId, state);

    return bot.sendMessage(chatId, '👤 Ismingizni kiriting:');
  }
});
