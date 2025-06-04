import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const forwardBotToken = process.env.FORWARD_BOT_TOKEN;
const forwardChatId = process.env.FORWARD_CHAT_ID;

const apartments = {
  '1 xonali': { desc: '1-xonali kvartira: 40m², 3-qavat, $25,000', price: 25000 },
  '2 xonali': { desc: '2-xonali kvartira: 60m², 5-qavat, $35,000', price: 35000 },
  '3 xonali': { desc: '3-xonali kvartira: 85m², 7-qavat, $50,000', price: 50000 },
};

const userState = new Map();
const adminChatId = process.env.ADMIN_CHAT_ID;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState.set(chatId, {});

  bot.sendMessage(chatId, 'Assalomu alaykum! Star House botiga xush kelibsiz. Quyidagi bo‘limlardan birini tanlang:', {
    reply_markup: {
      keyboard: [
        ['🏠 Xonadonlarni ko‘rish', '📅 Ko‘rishga yozilish'],
        ['📍 Offis manzili', '🎉 Aksiyalar']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userState.get(chatId) || {};

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
    bot.sendLocation(chatId, 41.270784, 69.209695);
    return bot.sendMessage(chatId, '📍 Manzil: Tashkent, Chilonzor tumani, Star House Residence');
  }

  if (text === '🎉 Aksiyalar') {
    state.step = 'promo_name';
    userState.set(chatId, state);
    bot.sendMessage(chatId, '🎉 Hozirgi aksiya: 3-xonali kvartiralarga 5% chegirma! Faqat 3 kun davomida.');
    return bot.sendMessage(chatId, '👤 Ismingizni kiriting:');
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

    bot.sendMessage(chatId, '✅ Maʼlumotlar qabul qilindi. Tez orada siz bilan bog‘lanamiz.');

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
    const months = [6, 12, 18];

    const options = months.map(m => [
      {
        text: `${m} oy - $${Math.round(info.price / m)}/oyiga`,
        callback_data: `plan:${type}:${m}`
      }
    ]);

    return bot.sendMessage(chatId, `📄 ${info.desc}\n\n💰 To‘lov variantlarini tanlang:`, {
      reply_markup: {
        inline_keyboard: options
      }
    });
  }

  if (data.startsWith('plan:')) {
    const [_, type, month] = data.split(':');
    const info = apartments[type];
    const price = Math.round(info.price / parseInt(month));

    state.selection = `${type}, ${month} oy - $${price}/oyiga`;
    state.step = 'apartment_name';
    userState.set(chatId, state);

    return bot.sendMessage(chatId, '👤 Ismingizni kiriting:');
  }
});
