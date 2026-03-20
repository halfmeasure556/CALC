
# Why are there two different .py files? BECAUSE JAVASCRIPT NEEDS ONE,
# I STILL DON’T FULLY KNOW WHY IT’S SUCH A HASSLE

import matplotlib
matplotlib.use("Agg")   # non-GUI since Tkinter broke my graph duplicating
import matplotlib.pyplot as plt

from flask import Flask, request, jsonify, render_template, url_for
from solver import FunctionSolver
import base64

# ===========================
# FLASK SETUP
# ===========================
app = Flask(__name__, static_folder="static", template_folder="templates")

# ===========================
# ROUTES
# ===========================

@app.route("/")
def index():
    return render_template("index.html")

# ---------- Evaluate ----------
@app.route("/SPP/CALC/solve/evaluate", methods=["POST"])
def evaluate():
    data = request.json
    print("DEBUG /evaluate received:", data)   # <-- Debug

    # Guard: if no expression, return 0 instead of Error
    if not data.get("expression"):
        return jsonify({"result": 0})

    solver = FunctionSolver(data["expression"])

    # Collect variable values (default to 0 if not provided)
    values = {
        'x': data.get("x", 0),
        'y': data.get("y", 0),
        'z': data.get("z", 0)
    }

    try:
        result = solver.evaluate(values)
    except Exception as e:
        print("DEBUG /evaluate error:", e)
        result = float(solver.expression.evalf())

    print("DEBUG /evaluate result:", result)   # <-- Debug
    return jsonify({"result": float(result)})

# ---------- Range ----------
@app.route("/SPP/CALC/solve/table", methods=["POST"])
def solve_table():
    data = request.json
    expr = data.get("expression", "").strip()
    if not expr:
        print("DEBUG /table error: empty expression")
        return jsonify({"table": "<p>Error: empty expression</p>"}), 400

    print("DEBUG /table received:", data)

    solver = FunctionSolver(expr)
    var = data.get("var", "x")
    start = data.get("start", -5)
    end = data.get("end", 5)
    step = data.get("step", 1)

    try:
        x_vals, y_vals = solver.table(start, end, step, var)
        x_vals = [float(x) for x in x_vals]
        y_vals = [float(y) for y in y_vals]
    except Exception as e:
        print("DEBUG /table error:", e)
        return jsonify({"table": "<p>Error: calculation failed</p>"}), 500

    # Build HTML table (stoopid)
    rows = "".join(
        f"<tr><td>{x}</td><td>{y}</td></tr>"
        for x, y in zip(x_vals, y_vals)
    )
    table_html = f"<table><tr><th>{var}</th><th>f({var})</th></tr>{rows}</table>"

    print("DEBUG /table result:", len(x_vals), "rows")
    return jsonify({"table": table_html})

# ---------- Derivative ----------
@app.route("/SPP/CALC/solve/derivative", methods=["POST"])
def solve_derivative():
    data = request.json
    print("DEBUG /derivative received:", data)

    expr = data.get("expression", "").strip()
    if not expr:
        print("DEBUG /derivative error: empty expression")
        return jsonify({"result": "Error: empty expression"}), 400

    solver = FunctionSolver(expr)
    values = {
        'x': data.get("x", 0),
        'y': data.get("y", 0),
        'z': data.get("z", 0)
    }
    var = data.get("var", "x")

    try:
        result = solver.derivative(var, values)
        # Convert solver output to string
        result_str = str(result)
        # Replacing Python-style exponent 
        result_str = result_str.replace("**", "^")
        # Clean up multiplication styling (That means it won´t show 2*x, instead 2x)
        result_str = result_str.replace("*x", "x")
        result_str = result_str.replace("*y", "y")
        result_str = result_str.replace("*z", "z")
    except Exception as e:
        print("DEBUG /derivative error:", e)
        result_str = "Error"

    print("DEBUG /derivative result:", result_str)
    return jsonify({"result": result_str})
# ---------- Integral ----------
@app.route("/SPP/CALC/solve/integral", methods=["POST"])
def solve_integral():
    data = request.json
    expr = data.get("expression", "").strip()
    if not expr:
        print("DEBUG /integral error: empty expression")
        return jsonify({"result": "Error: empty expression"}), 400

    solver = FunctionSolver(expr)
    var = data.get("var", "x")
    start = data.get("start", 0)
    end = data.get("end", 1)

    try:
        # FIXED AT LAST
        result = solver.integral(start, end, var)
        print("DEBUG /integral result:", result)
        return jsonify({"result": result})
    except Exception as e:
        print("DEBUG /integral error:", e)
        return jsonify({"result": "Error"})

# ---------- Root ----------
@app.route("/SPP/CALC/solve/root", methods=["POST"])
def solve_root():
    data = request.json
    expr = data.get("expression", "").strip()
    if not expr:
        print("DEBUG /root error: empty expression")
        return jsonify({"rootFound": False, "value": None}), 400

    solver = FunctionSolver(expr)
    var = data.get("var", "x")
    start = data.get("start", 0)
    end = data.get("end", 1)
    step = data.get("step", 0.1)

    try:
        root_val = solver.root(start, end, step, var)
        if root_val is not None:
            print("DEBUG /root result:", root_val)
            return jsonify({"rootFound": True, "value": root_val})
        else:
            print("DEBUG /root result: no root found")
            return jsonify({"rootFound": False, "value": None})
    except Exception as e:
        print("DEBUG /root error:", e)
        return jsonify({"rootFound": False, "value": None})

# ---------- Plot ----------
@app.route("/SPP/CALC/solve/plot", methods=["POST"])
def solve_plot():
    data = request.json
    expr = data.get("expression", "").strip()
    if not expr:
        print("DEBUG /plot error: empty expression")
        return jsonify({"image": None}), 400

    solver = FunctionSolver(expr)
    var = data.get("var", "x")
    start = data.get("start", -5)
    end = data.get("end", 5)
    step = data.get("step", 0.5)

    try:
        # Generate grapghhghghh
        filename = solver.plot(start, end, step, var)

        # Read file and encode base64 (else it doesn´t show in window, i tried it)
        with open(filename, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")

        print("DEBUG /plot result: base64 image generated")
        return jsonify({"image": encoded})
    except Exception as e:
        print("DEBUG /plot error:", e)
        return jsonify({"image": None})

# ---------- Ping ---------- # I added this because my page was giving connectivity problems, it WILL stay, im not sorry
@app.route("/SPP/CALC/ping")
def ping():
    return jsonify({"msg": "pong"})

# ===========================
# RUN
# ===========================
if __name__ == "__main__":
    app.run(debug=True)
