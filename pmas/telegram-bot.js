const TELEGRAM_BOT_TOKEN = '7996569703:AAHRcZDGOXY0IF_1hjelMeDYc6yizygVqF4';
const TELEGRAM_CHANNEL_ID = '-1001100250703';
const TELEGRAM_CHANNEL_USERNAME = '@PIPSMASTER22';

export async function sendSignalToTelegram(signal) {
    const message = formatSignalMessage(signal);
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHANNEL_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending signal to Telegram:', error);
        throw error;
    }
}

function formatSignalMessage(signal) {
    return `
🔥 <b>PIPS MASTER SIGNAL</b> 🔥

📊 <b>GOLD (XAUUSD)</b>
${signal.type === 'BUY' ? '🟢' : '🔴'} <b>${signal.type}</b>

📍 Entry: ${signal.entry}

🎯 Take Profit:
   TP1 (2min): $${signal.takeProfits[0]}
   TP2 (5min): $${signal.takeProfits[1]}
   TP3 (7min): $${signal.takeProfits[2]}
   TP4 (10min): $${signal.takeProfits[3]}

🛑 Stop Loss: ${signal.stopLoss}

⚠️ Risk Management:
- Use proper position sizing
- Follow stop loss strictly
- Book profits at given time targets

#GOLD #XAUUSD #Trading
    `;
}

export async function getChannelStats() {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMemberCount`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHANNEL_ID
            })
        });
        
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error getting channel stats:', error);
        throw error;
    }
} 