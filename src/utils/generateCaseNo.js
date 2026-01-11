import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

export async function generateCaseNo(valuer) {
  const counterRef = doc(db, "counters", valuer);

  const caseNo = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);

    let next = 1;

    if (snap.exists()) {
      next = snap.data().last + 1;
      tx.update(counterRef, { last: next });
    } else {
      tx.set(counterRef, { last: 1 });
    }

    // formatting
    const padded =
      valuer === "M"
        ? String(next).padStart(2, "0")   // M01
        : String(next).padStart(3, "0");  // K001

    return `${valuer}${padded}`;
  });

  return caseNo;
}
