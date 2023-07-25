"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var experiment_ts_1 = require("@completium/experiment-ts");
var bignumber_js_1 = require("bignumber.js");
var archetype_ts_types_1 = require("@completium/archetype-ts-types");
function tezBNtoString(input) {
    if (input === new bignumber_js_1.BigNumber(0))
        return "0 tez";
    if (!input)
        throw Error("tezBigNumberToString input is invalid.");
    return "".concat(input.dividedBy(1000000).toNumber(), " tez");
}
function posify(num) {
    if (num.isNegative())
        return num.negated();
    return num;
}
function get_cost(storage_difference, gas_used, bytes_size) {
    var fees = 100 + bytes_size + gas_used * 0.1;
    var burn = storage_difference * 250;
    return new bignumber_js_1.BigNumber(fees + burn).integerValue(bignumber_js_1.BigNumber.ROUND_UP);
}
var handleDelayInput = function (delay) {
    var output = 0;
    if (typeof delay == 'number')
        output = delay;
    if (typeof delay == 'string')
        output = new archetype_ts_types_1.Duration(delay).toSecond();
    if (delay instanceof archetype_ts_types_1.Duration)
        output = delay.toSecond();
    return output;
};
// with_cost function provides the cost of a transaction
var make_call_get_delta = function (f, call_params) { return __awaiter(void 0, void 0, void 0, function () {
    var balance_before, res, balance_after;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, call_params.as.get_balance()];
            case 1:
                balance_before = _a.sent();
                return [4 /*yield*/, f(call_params)
                    // const cost = get_cost(
                    //   res.paid_storage_size_diff,
                    //   res.consumed_gas,
                    //   res.storage_size
                    // )
                ];
            case 2:
                res = _a.sent();
                return [4 /*yield*/, call_params.as.get_balance()];
            case 3:
                balance_after = _a.sent();
                return [2 /*return*/, {
                        delta: balance_before.to_big_number().minus(balance_after.to_big_number()),
                        call_result: res,
                    }];
        }
    });
}); };
function run_scenario_test(
// scenario_description: string,
call_makers, tpArray, mode) {
    if (mode === void 0) { mode = 'verbose'; }
    return __awaiter(this, void 0, void 0, function () {
        var _i, tpArray_1, tp, _a, _loop_1, _b, call_makers_1, cm, _c, tpArray_2, tp, actual_before, actual_after, actual_change, actual_direction, actual_amount, num_calls_this_account, tolerance, actual_string, expected_string, end_string, apparent_costs_string;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _i = 0, tpArray_1 = tpArray;
                    _d.label = 1;
                case 1:
                    if (!(_i < tpArray_1.length)) return [3 /*break*/, 4];
                    tp = tpArray_1[_i];
                    tp.ec_BN = new bignumber_js_1.BigNumber(tp.expected_change).times(1000000);
                    _a = tp;
                    return [4 /*yield*/, tp.account.get_balance()];
                case 2:
                    _a.actual_before = (_d.sent()).to_big_number();
                    tp.expected_direction = tp.ec_BN.isZero()
                        ? 'unchanged'
                        : tp.ec_BN.isPositive()
                            ? 'increase'
                            : 'decrease';
                    tp.expected_amount = new archetype_ts_types_1.Tez(posify(tp.ec_BN), 'mutez').toString('tez');
                    tp.accumulated_approx_cost = new bignumber_js_1.BigNumber(0);
                    tp.cost_array = [];
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    _loop_1 = function (cm) {
                        var target_tp_index, _e, delta, call_result, approximate_cost, cost_accumulator;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    if (!cm.amount)
                                        throw ('amount must be explicitly specified for account: ' + cm.as.get_name());
                                    if (!cm.as)
                                        throw 'account must be explicitly specified for m cms';
                                    target_tp_index = tpArray.findIndex(function (tp) { return tp.account === cm.as; });
                                    if (!(target_tp_index !== -1)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, make_call_get_delta(cm.call, {
                                            as: cm.as,
                                            amount: cm.amount,
                                        })];
                                case 1:
                                    _e = _f.sent(), delta = _e.delta, call_result = _e.call_result;
                                    console.log('delta: ', delta);
                                    approximate_cost = get_cost(call_result.paid_storage_size_diff, call_result.consumed_gas, call_result.storage_size).dividedBy(2);
                                    cost_accumulator = tpArray[target_tp_index].accumulated_approx_cost.plus(approximate_cost);
                                    tpArray[target_tp_index].accumulated_approx_cost = cost_accumulator;
                                    tpArray[target_tp_index].cost_array.push({
                                        call_name: cm.name,
                                        approximate_cost: approximate_cost,
                                    });
                                    _f.label = 2;
                                case 2:
                                    cm.delay_seconds = handleDelayInput(cm.delay_after);
                                    (0, experiment_ts_1.delay_mockup_now_by_second)(cm.delay_seconds);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _b = 0, call_makers_1 = call_makers;
                    _d.label = 5;
                case 5:
                    if (!(_b < call_makers_1.length)) return [3 /*break*/, 8];
                    cm = call_makers_1[_b];
                    return [5 /*yield**/, _loop_1(cm)];
                case 6:
                    _d.sent();
                    _d.label = 7;
                case 7:
                    _b++;
                    return [3 /*break*/, 5];
                case 8:
                    _c = 0, tpArray_2 = tpArray;
                    _d.label = 9;
                case 9:
                    if (!(_c < tpArray_2.length)) return [3 /*break*/, 12];
                    tp = tpArray_2[_c];
                    actual_before = tp.actual_before;
                    return [4 /*yield*/, tp.account.get_balance()];
                case 10:
                    actual_after = (_d.sent()).to_big_number();
                    tp.expected_after = actual_before.plus(tp.ec_BN);
                    tp.expected_after_approx_costs = tp.expected_after.minus(tp.accumulated_approx_cost);
                    actual_change = actual_after.minus(actual_before);
                    actual_direction = actual_change.isZero()
                        ? 'unchanged'
                        : actual_change.isPositive()
                            ? 'increase'
                            : 'decrease';
                    actual_amount = tezBNtoString(posify(actual_change));
                    num_calls_this_account = tp.cost_array.length;
                    tolerance = new bignumber_js_1.BigNumber(num_calls_this_account).times(150000);
                    tp.tolerance = tolerance;
                    tp.actual_after = actual_after;
                    tp.difference = actual_after.minus(tp.expected_after).abs();
                    actual_string = "\n\tactual: ".concat(actual_direction, " by ").concat(actual_amount);
                    expected_string = "\n\texpected: ".concat(tp.expected_direction, " by ").concat(tp.expected_amount);
                    end_string = "\n\t-----\n";
                    apparent_costs_string = tp.cost_array.length > 0
                        ? "\n\tapparent real total costs: ".concat(tp.difference.toString(), " mutez")
                        : '';
                    if (mode == 'verbose') {
                        tp.info_message =
                            "\n\tSUCCESS: ".concat(tp.account.get_name(), "\n\t") +
                                actual_string +
                                apparent_costs_string +
                                end_string;
                        tp.error_message =
                            "\n\tERROR: ".concat(tp.account.get_name(), "\n\t ") +
                                expected_string +
                                actual_string +
                                apparent_costs_string +
                                end_string;
                    }
                    _d.label = 11;
                case 11:
                    _c++;
                    return [3 /*break*/, 9];
                case 12: return [2 /*return*/, tpArray];
            }
        });
    });
}
exports.default = run_scenario_test;
