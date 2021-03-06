import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import {
  startAddExpense,
  addExpense,
  removeExpense,
  editExpense,
  startEditExpense,
  setExpenses,
  startSetExpenses,
  startRemoveExpense
} from "../../actions/expenses";
import expenses from "../fixtures/expenses";
import database from "../../firebase/firebase";

const uid = "Test uid";
const defaultAuthState = { auth: { uid } };
const createMockStore = configureMockStore([thunk]);

beforeEach(done => {
  const expenseData = {};
  expenses.forEach(({ id, description, note, amount, createdAt }) => {
    expenseData[id] = { description, note, amount, createdAt };
  });
  database
    .ref(`users/${uid}/expenses`)
    .set(expenseData)
    .then(() => {
      done();
    });
});

test("should set up remove expense action object", () => {
  const action = removeExpense({ id: "123abc" });
  expect(action).toEqual({
    type: "REMOVE_EXPENSE",
    id: "123abc"
  });
});

test("should remove expense from firebase", done => {
  const store = createMockStore(defaultAuthState);
  const id = expenses[2].id;
  store
    .dispatch(startRemoveExpense({ id }))
    .then(() => {
      const actions = store.getActions();
      expect(actions[0]).toEqual({
        type: "REMOVE_EXPENSE",
        id
      });
      return database.ref(`users/${uid}/expenses/${id}`).once("value");
    })
    .then(snapshot => {
      expect(snapshot.val()).toBeFalsy();
      done();
    });
});

test("should set up edit expense action object", () => {
  const action = editExpense("123abcd", { note: "New note value" });
  expect(action).toEqual({
    type: "EDIT_EXPENSE",
    id: "123abcd",
    updates: {
      note: "New note value"
    }
  });
});

test("should edit expense with firebase", done => {
  const store = createMockStore(defaultAuthState);
  const id = expenses[1].id;
  const updates = { amount: 24510 };
  store
    .dispatch(startEditExpense(id, updates))
    .then(() => {
      const actions = store.getActions();
      expect(actions[0]).toEqual({
        type: "EDIT_EXPENSE",
        id,
        updates
      });
      return database.ref(`users/${uid}/expenses/${id}`).once("value");
    })
    .then(snapshot => {
      expect(snapshot.val().amount).toBe(updates.amount);
      done();
    });
});
test("should set up add expence action with provided values", () => {
  const action = addExpense(expenses[2]);
  expect(action).toEqual({
    type: "ADD_EXPENSE",
    expenses: expenses[2]
  });
});

test("should add expense to database and store", done => {
  const store = createMockStore(defaultAuthState);
  const expenseData = {
    description: "Mouse",
    amount: 400,
    note: "zxyz",
    createdAt: 1000
  };
  store
    .dispatch(startAddExpense(expenseData))
    .then(() => {
      const actions = store.getActions();
      expect(actions[0]).toEqual({
        type: "ADD_EXPENSE",
        expenses: {
          id: expect.any(String),
          ...expenseData
        }
      });

      return database
        .ref(`users/${uid}/expenses/${actions[0].expenses.id}`)
        .once("value");
    })
    .then(snapshot => {
      expect(snapshot.val()).toEqual(expenseData);
      done();
    });
});

test("should add expense with defaults to database and store", done => {
  {
    const store = createMockStore(defaultAuthState);
    const expenseDefaults = {
      description: "",
      amount: 0,
      note: "",
      createdAt: 0
    };
    store
      .dispatch(startAddExpense({}))
      .then(() => {
        const actions = store.getActions();
        expect(actions[0]).toEqual({
          type: "ADD_EXPENSE",
          expenses: {
            id: expect.any(String),
            ...expenseDefaults
          }
        });

        return database
          .ref(`users/${uid}/expenses/${actions[0].expenses.id}`)
          .once("value");
      })
      .then(snapshot => {
        expect(snapshot.val()).toEqual(expenseDefaults);
        done();
      });
  }
});

test("should set up set expense action object with data", () => {
  const action = setExpenses(expenses);
  expect(action).toEqual({
    type: "SET_EXPENSES",
    expenses
  });
});

test("should fetch the expenses from firebase", done => {
  const store = createMockStore(defaultAuthState);
  store.dispatch(startSetExpenses()).then(() => {
    const actions = store.getActions();
    expect(actions[0]).toEqual({
      type: "SET_EXPENSES",
      expenses
    });
    done();
  });
});
