# Before anyone asks, I tried, I REALLY tried to stay in ipynb but it was more effective to switch to .py since I was having trouble importing from my own files, im sorry

# Importing (as always)

import numpy as np
import sympy as sp
from sympy import sympify, sin, cos, tan, pi
import matplotlib.pyplot as plt

class FunctionSolver:
    def __init__(self, expression: str):
        # Store the raw exp (string, it has to be string)
        self.expression_str = expression
        # Parse with trig functions and pi (I WANT TRIANGLE SOLVING OKAY?)
        self.expression = sympify(expression, locals={'sin': sin, 'cos': cos, 'tan': tan, 'pi': pi})

    def evaluate(self, values: dict) -> float:
        """Evaluate the expression with given values for x, y, z."""
        return float(self.expression.evalf(subs=values))

    def derivative(self, var: str = "x", values: dict = None) -> str:
        """Return the symbolic derivative with respect to var."""
        try:
            var_symbol = sp.symbols(var)
            derivative_expr = sp.diff(self.expression, var_symbol)
            return str(derivative_expr)
        except Exception as e:
            print("DEBUG FunctionSolver.derivative error:", e)
            return "Error"

    def integral(self, start: float, end: float, var: str = "x") -> float:
        """Compute the integral over [start, end] with respect to var (THIS MESSED ME UP BEFORE)."""
        sym = sp.symbols(var)
        try:
            result = sp.integrate(self.expression, (sym, start, end))
            return float(result.evalf())  # <-- force numeric evaluation
        except Exception as e:
            print("DEBUG FunctionSolver.integral error:", e)
            return "Error"

    def table(self, start: float, end: float, step: float, var: str = "x"):
        """Generate values over a range for the chosen var."""
        sym = sp.symbols(var)
        x_vals = np.arange(start, end + step, step)
        f = sp.lambdify(sym, self.expression, 'numpy')
        return list(x_vals), list(f(x_vals))

    def root(self, start: float, end: float, step: float, var: str = "x"):
        """Find a root in [start, end] (OLD VERSION ONLY CHECKED POINTS, IT SUCKED)."""
        sym = sp.symbols(var)
        try:
            # Use SymPy to solve properly in the interval
            roots = sp.solveset(self.expression, sym, domain=sp.Interval(start, end))
            if roots.is_empty:
                return None
            # Return first root found (skip multiple roots ew)
            for r in roots:
                return float(r.evalf())
        except Exception as e:
            print("DEBUG FunctionSolver.root error:", e)
            return None

    def plot(self, start: float, end: float, step: float, var: str = "x", filename: str = "static/plot.png") -> str:
        """Save a plot of the function and its derivative, return file path."""
        sym = sp.symbols(var)
        x_vals = np.arange(start, end + step, step)
        f = sp.lambdify(sym, self.expression, 'numpy')
        y_vals = f(x_vals)

        derivative_expr = sp.diff(self.expression, sym)
        f_prime = sp.lambdify(sym, derivative_expr, 'numpy')
        y_prime_vals = f_prime(x_vals)

        plt.figure(figsize=(10, 6))
        plt.plot(x_vals, y_vals, color="#a7c7e7", linewidth=3, label="f(x)")
        plt.plot(x_vals, y_prime_vals, color="#cba6f7", linestyle="--", label="f'(x)")
        plt.axhline(0, color="black", linewidth=0.8)
        plt.axvline(0, color="black", linewidth=0.8)
        plt.grid(alpha=0.3)
        plt.legend()
        plt.title("Function & Derivative", fontsize=16, color="#232323")
        plt.savefig(filename) # save (bruh)
        plt.close()           # close the figure to free memory (I´m running out of mb´s to spare)
        return filename       # return the file path
