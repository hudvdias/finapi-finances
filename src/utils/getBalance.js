export const getBalance = (statement) => {
  const balance = statement.reduce((accumulator, operation) => {
    if (operation.type === "credit") {
      return accumulator + operation.amount;
    } else {
      return accumulator - operation.amount;
    }
  }, 0);

  return balance;
};
