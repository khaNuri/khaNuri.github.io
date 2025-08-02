function savePosition() {
  const symbol = document.getElementById("symbolInput").value.trim();
  const isLong = document.getElementById("isLongCheckbox").checked;
  const startingPrice = parseFloat(document.getElementById("startingPriceInput").value);

  if (!symbol || isNaN(startingPrice)) return;

  const newPosition = {
    symbol,
    isLong,
    startingPrice,
    currentPrice: 0.0,
    profitLoss: 0.0,
    profitLossPercentage: 0.0,
  };
  

  const existing = JSON.parse(localStorage.getItem("positions") || "[]");
  existing.push(newPosition);
  localStorage.setItem("positions", JSON.stringify(existing));

  window.location.href = "/";
}


async function fetchCurrentPrices() {
  const positions = JSON.parse(localStorage.getItem("positions") || "[]");
  const symbols = positions.map(p => p.symbol);

  const priceMap = {};

  for (const symbol of symbols) {
    const binanceSymbol = symbol.replace("/", "").toUpperCase(); // 🛠 burası düzeltildi

    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
      const data = await response.json();
      priceMap[symbol] = parseFloat(data.price);
    } catch (error) {
      console.error(`Hata: ${symbol} için fiyat alınamadı`, error);
      priceMap[symbol] = null;
    }
  }

  const updated = positions.map(pos => {
    const current = priceMap[pos.symbol];
    if (current == null) return pos;

    const pl = pos.isLong
      ? current - pos.startingPrice
      : pos.startingPrice - current;

    const plPerc = (pl / pos.startingPrice) * 100;

    return {
      ...pos,
      currentPrice: current,
      profitLoss: parseFloat(pl.toFixed(2)),
      profitLossPercentage: parseFloat(plPerc.toFixed(2))
    };
  });

  localStorage.setItem("positions", JSON.stringify(updated));

  return priceMap;
}


async function handleRefresh() {
  await fetchCurrentPrices();
  renderPositions();
}


function renderPositions() {
  const positions = JSON.parse(localStorage.getItem("positions") || "[]");
  const container = document.getElementById("positionList");
  container.innerHTML = "";

  positions.forEach((pos, index) => {
    const box = document.createElement("div");
    box.className = "box mb-3";

    const plClass =
      pos.profitLoss > 0
        ? "has-text-success"
        : pos.profitLoss < 0
        ? "has-text-danger"
        : "";

    box.innerHTML = `
      <div class="is-size-5">
      <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
        <span class="is-size-5">${pos.symbol}</span>
        <button class="delete is-small" onclick="deletePosition(${index})"></button>
      </div>
      <div class="is-flex is-justify-content-space-between mb-1">
        <span>${pos.isLong ? "Long" : "Short"}</span>
        <span>${pos.startingPrice}</span>
      </div>
      <div class="is-flex is-justify-content-space-between mb-1">
        <span>${pos.currentPrice}</span>
        <span class="${plClass}">${pos.profitLoss} (${pos.profitLossPercentage}%)</span>
      </div></div>
    `;

    container.appendChild(box);
  });
}
document.addEventListener("DOMContentLoaded", () => {
  renderPositions();
  handleRefresh();
});

function deletePosition(index) {
  const positions = JSON.parse(localStorage.getItem("positions") || "[]");
  positions.splice(index, 1);
  localStorage.setItem("positions", JSON.stringify(positions));
  renderPositions(); // yeniden çiz
}