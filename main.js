import { TicTacToeRender } from "./TicTacToe";
import { createElement, render, Component } from "./toy-react";

class MyComponent extends Component {
  constructor() {
    super();
    this.state = {
      a: 1,
      b: 2,
    };
  }
  render() {
    return (
      <div>
        <button
          onClick={() => {
            this.setState({ a: this.state.a + 1 });
          }}>
          aaa
        </button>
        <span>
          {this.state.a}||
          {this.state.b}
        </span>

        {this.children}
      </div>
    );
  }
}
let a = (
  <MyComponent id="a">
    <div></div>
    <div>12222</div>
    <div>2</div>
  </MyComponent>
);
console.log("[a.vdom]", a.vdom);
render(a, document.getElementById("root"));
TicTacToeRender();
