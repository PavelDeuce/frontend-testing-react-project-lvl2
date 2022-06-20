/* eslint-disable import/no-extraneous-dependencies */
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import _ from 'lodash';

const runServer = (initialState) => {
  const prefix = 'http://localhost/api/v1';
  const createPath = (...paths) => [prefix, ...paths].join('/');
  const state = initialState;

  const handlers = [
    rest.post(createPath('lists', ':id', 'tasks'), (req, res, ctx) => {
      const mockedTask = {
        completed: false,
        id: 3 + Number(_.uniqueId()),
        listId: Number(req.params.id),
        text: req.body.text,
        touched: 1655371223931,
      };
      state.tasks.push(mockedTask);
      ctx.delay();
      return res(ctx.json(mockedTask));
    }),
    rest.patch(createPath('tasks', ':id'), (req, res, ctx) => {
      const foundedTask = state.tasks.find((task) => task.id === Number(req.params.id));
      ctx.delay();
      state.tasks.filter((task) => task.id !== req.params.id);
      state.tasks.push({ ...foundedTask, completed: req.body.completed });
      const taskIndex = state.tasks.findIndex((task) => task.id === foundedTask.id);
      return res(ctx.json({ ...state.tasks[taskIndex], completed: req.body.completed }));
    }),
    rest.delete(createPath('tasks', ':id'), (req, res, ctx) => {
      state.tasks.filter((task) => task.id !== req.params.id);
      ctx.delay();
      return res(ctx.status(204));
    }),
  ];

  return setupServer(...handlers);
};

export default runServer;
