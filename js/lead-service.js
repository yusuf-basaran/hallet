export function createLeadService({ db, doc, getDoc, runTransaction, serverTimestamp }) {
  const failure = code => Object.assign(new Error(code), { code });

  return async function unlockLead(uid, jobId) {
    if (!uid) throw failure("permission-denied");
    const userReference = doc(db, "users", uid);
    const jobReference = doc(db, "job_requests", jobId);
    try {
      await runTransaction(db, async transaction => {
        const userSnapshot = await transaction.get(userReference);
        const jobSnapshot = await transaction.get(jobReference);
        if (!userSnapshot.exists() || !jobSnapshot.exists()) throw failure("not-found");
        const account = userSnapshot.data();
        const job = jobSnapshot.data();
        if (job.unlockedBy.includes(uid)) return;
        if (account.role !== "pro" || account.city !== job.city || !account.categories.includes(job.category)) {
          throw failure("permission-denied");
        }
        if (job.status !== "open") throw failure("hallet/closed");
        if (!Number.isInteger(account.credits) || account.credits < 1) throw failure("hallet/no-credits");
        transaction.update(userReference, { credits: account.credits - 1 });
        transaction.update(jobReference, { unlockedBy: [...job.unlockedBy, uid] });
        transaction.set(doc(db, "users", uid, "private", "unlock"), { jobId, createdAt: serverTimestamp() });
      });
    } catch (error) {
      const latest = await getDoc(jobReference).catch(() => null);
      if (!latest?.exists() || !latest.data().unlockedBy.includes(uid)) throw error;
    }
    const contact = await getDoc(doc(db, "job_requests", jobId, "private", "contact"));
    if (!contact.exists()) throw failure("not-found");
    return contact.data().customerPhone;
  };
}
