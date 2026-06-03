const { Chess } = require('chess.js');

async function test() {
  const res = await fetch('https://api.chess.com/pub/puzzle/random');
  const data = await res.json();
  const pgn = data.pgn;
  const fen = data.fen;
  
  const movesStr = pgn.split('\n\n')[1] || pgn.split('\r\n\r\n')[1];
  if (!movesStr) return console.error('No moves string', pgn);
  
  const sans = movesStr.split(/\s+/).filter(t => t !== '*' && !t.match(/^[0-9]+\.$/)).map(t => t.replace(/^[0-9]+\.+/, ''));
  
  const c = new Chess(fen);
  const lans = sans.map(san => {
    const m = c.move(san);
    return m ? m.from + m.to + (m.promotion || '') : null;
  });
  
  console.log({ fen, solution: lans });
}

test();
