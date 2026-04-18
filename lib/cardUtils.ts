export function generateCardDetails(address: string) {
  if (!address) {
    return {
      number: "•••• •••• •••• ••••",
      cvv: "•••",
      name: "TRANZO USER",
      expiry: "12/28"
    };
  }
  
  // Extract all numbers from the hex address
  const hexNumbers = address.replace(/\D/g, "");
  
  // Create a 16-digit pseudo-random-looking card number based on address
  // We prepend "4" so it looks like a Visa card for the demo
  const padded = ("4" + hexNumbers + "4242424242424242").slice(0, 16);
  const cardNumber = padded.replace(/(.{4})/g, '$1 ').trim();
  
  // Create a 3-digit CVV based on the end of the address
  // Use a simple hash of the address string so it's consistent but looks random
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = Math.imul(31, hash) + address.charCodeAt(i) | 0;
  }
  const cvv = Math.abs(hash).toString().slice(0, 3).padStart(3, "7");

  return {
    number: cardNumber,
    cvv,
    name: "TRANZO USER",
    expiry: "12/28"
  };
}

export interface TxRecord {
  hash: string;
  type: "send" | "receive";
  amount: string;
  to: string;
  time: string;
  status: string;
  merchant?: string;
}

export function getTxHistory(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("tranzo_tx_history");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function addTxHistory(tx: TxRecord) {
  if (typeof window === "undefined") return;
  const history = getTxHistory();
  // prepend
  history.unshift(tx);
  localStorage.setItem("tranzo_tx_history", JSON.stringify(history));
  window.dispatchEvent(new StorageEvent("storage", { key: "tranzo_tx_history" }));
}

export function getAccumulatedSpend(): number {
  if (typeof window === "undefined") return 0;
  const history = getTxHistory();
  // Sum of "send" types today
  const today = new Date().toDateString();
  const spent = history
    .filter(tx => tx.type === "send" && new Date(tx.time).toDateString() === today)
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  return spent;
}
