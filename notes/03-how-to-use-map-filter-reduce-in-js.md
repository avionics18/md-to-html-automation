# How to Use Map, Filter, and Reduce in JavaScript

Functional programming has been making quite a splash in the development world these days. And for good reason: Functional techniques can help you write more declarative code that is easier to understand at a glance, refactor, and test.

One of the cornerstones of functional programming is its special use of lists and list operations. Those things are exactly what they sound like: arrays of things and the stuff you do to them. But the functional mindset treats them a bit differently than you might expect.

This article will take a close look at what I like to call the "big three" list operations: `map`, `filter`, and `reduce`. Wrapping your head around these three functions is an important step towards being able to write clean, functional code, and it opens the doors to the vastly powerful techniques of functional and reactive programming.

Curious? Let's dive in.

-   [A Map From List to List](#a-map-from-list-to-list)
-   [Filter Out the Noise](#)
-   [The Reduce Method](#)
-   [Putting It Together: Map, Filter, Reduce, and Chainability](#)
-   [Conclusion and Next Steps](#)

## A Map From List to List

Often, we find ourselves needing to take an array and modify every element in it in exactly the same way. Typical examples of this are squaring every element in an array of numbers, retrieving the name from a list of users, or running a regex against an array of strings.

`map` is a method built to do exactly that. It's defined on `Array.prototype`, so you can call it on any array, and it accepts a callback as its first argument.

The syntax for `map` is shown below.

```js
let newArray = arr.map(callback(currentValue[, index[, array]]) {
  // return element for newArray, after executing something
}[, thisArg]);
```

When you call `map` on an array, it executes that callback on every element within it, returning a new array with all of the values that the callback returned.

Under the hood, `map` passes three arguments to your callback:

-   the _current item_ in the array
-   the _array index_ of the current item
-   the _entire array_ you called `map` on

Let's look at some code.

### `map` in Practice

Suppose we have an app that maintains an array of your tasks for the day. Each `task` is an object, each with a `name` and `duration` property:

```js
// Durations are in minutes
const tasks = [
    {
        name: "Write for Envato Tuts+",
        duration: 120,
    },
    {
        name: "Work out",
        duration: 60,
    },
    {
        name: "Procrastinate on Duolingo",
        duration: 240,
    },
];
```

Let's say we want to create a new array with just the name of each task, so we can take a look at everything we've done today. Using a `for` loop, we'd write something like this:

```js
const task_names = [];

for (let i = 0, max = tasks.length; i < max; i += 1) {
    task_names.push(tasks[i].name);
}
console.log(task_names);
// [ 'Write for Envato Tuts+', 'Work out', 'Procrastinate on Duolingo' ]
```

JavaScript also offers a `forEach` loop. It functions like a `for` loop, but manages all the messiness of checking our loop index against the array length for us:

```js
const task_names = [];

tasks.forEach(function (task) {
    task_names.push(task.name);
});
console.log(task_names);
// [ 'Write for Envato Tuts+', 'Work out', 'Procrastinate on Duolingo' ]
```

Using `map`, we can simply write:

```js
const task_names = tasks.map(function (task, index, array) {
    return task.name;
});
console.log(task_names);
// [ 'Write for Envato Tuts+', 'Work out', 'Procrastinate on Duolingo' ]
```

Here I included the `index` and `array` parameters to remind you that they're there if you need them. Since I didn't use them here, though, you could leave them out, and the code would run just fine.

An even more succinct way of writing `map` in modern JavaScript is with arrow functions.

```js
const task_names = tasks.map((task) => task.name);
console.log(task_names);
// ['Write for Envato Tuts+', 'Work out', 'Procrastinate on DuoLingo']
```
