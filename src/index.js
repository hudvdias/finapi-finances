const express = require("express");
const { v4: uuidv4 } = require("uuid");

// App

const app = express();

// App uses

app.use(express.json());

// Memory database

const customers = [];

// Middleware

const verifyIfExistisAccountCPF = (request, response, next) => {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found." });
  }

  request.customer = customer;

  return next();
};

// Utils

const getBalance = (statement) => {
  const balance = statement.reduce((accumulator, operation) => {
    if (operation.type === "credit") {
      return accumulator + operation.amount;
    } else {
      return accumulator - operation.amount;
    }
  }, 0);

  return balance;
};

// Routes

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists." });
  }

  const customer = {
    id: uuidv4(),
    cpf,
    name,
    statement: [],
  };

  customers.push(customer);

  return response.status(201).json(customer);
});

app.get("/accounts", (request, response) => {
  return response.status(200).json(customers);
});

app.get("/account", verifyIfExistisAccountCPF, (request, response) => {
  const { customer } = request;

  return response.status(200).json(customer);
});

app.put("/account", verifyIfExistisAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).json(customer);
});

app.delete("/account", verifyIfExistisAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(204).send();
});

app.get("/statement", verifyIfExistisAccountCPF, (request, response) => {
  const { customer } = request;

  return response.status(200).json(customer.statement);
});

app.get("/statement/date", verifyIfExistisAccountCPF, (request, response) => {
  const { date } = request.query;
  const { customer } = request;

  const dateFormated = new Date(date);

  const statement = customer.statement.filter(
    (statement) =>
      statement.createdAt.toDateString() === dateFormated.toDateString()
  );

  return response.status(200).json(statement);
});

app.get("/balance", verifyIfExistisAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.status(200).json(balance);
});

app.post("/deposit", verifyIfExistisAccountCPF, (request, response) => {
  const { amount, description } = request.body;
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).json(statementOperation);
});

app.post("/withdraw", verifyIfExistisAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!" });
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).json(statementOperation);
});

// Listener

app.listen(3333, () => {
  console.log("App is running...");
  return;
});
