import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const apartments = {
  '1 xonali': '1-xonali kvartira: 40m², 3-qavat, $25,000',
  '2 xonali': '2-xonali kvartira: 60m², 5-qavat, $35,000',
  '3 xonali': '3-xonali kvartira: 85m², 7-qavat, $50,000',
};

const userState = new Map();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState.set(chatId, {});

  bot.sendMessage(chatId, 'Assalomu alaykum! Star House botiga xush kelibsiz. Ismingizni yozing:');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userState.get(chatId) || {};

  if (!state.name) {
    state.name = text;
    userState.set(chatId, state);
    return bot.sendMessage(chatId, 'Telefon raqamingizni yuboring:');
  }

  if (!state.phone) {
    state.phone = text;
    userState.set(chatId, state);
    return bot.sendMessage(chatId, 'Qaysi turdagi kvartiraga qiziqasiz?', {
      reply_markup: {
        inline_keyboard: Object.keys(apartments).map((type) => [{
          text: type,
          callback_data: `apartment:${type}`
        }])
      }
    });
  }
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('apartment:')) {
    const selected = data.split(':')[1];
    bot.sendMessage(chatId, `📄 ${apartments[selected]}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📅 Ko‘rishga yozilish', callback_data: 'visit' }],
          [{ text: '📞 Qo‘ng‘iroq qilish uchun kontakt qoldirish', callback_data: 'call' }],
          [{ text: '📍 Ofis manzili', callback_data: 'location' }]
        ]
      }
    });
  }

  if (data === 'visit') {
    bot.sendMessage(chatId, 'Iltimos, qaysi kunga ekskursiya belgilaymiz? (Masalan: 29-may)');
  }

  if (data === 'call') {
    bot.sendMessage(chatId, 'Kontaktlaringiz yuborildi. Tez orada bog‘lanamiz.');
    // Adminlarga xabar yuborish mumkin
  }

  if (data === 'location') {
    bot.sendLocation(chatId, 41.311081, 69.240562); // Toshkent uchun misol
    bot.sendMessage(chatId, '📍 Manzil: Tashkent, Yunusobod tumani, Star House ofisi');
  }
});
