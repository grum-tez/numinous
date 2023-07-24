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
Object.defineProperty(exports, "__esModule", { value: true });
const experiment_ts_1 = require("@completium/experiment-ts");
const bignumber_js_1 = require("bignumber.js");
const archetype_ts_types_1 = require("@completium/archetype-ts-types");
function tezBNtoString(input) {
    if (input === new bignumber_js_1.BigNumber(0))
        return `0 tez`;
    if (!input)
        throw Error(`tezBigNumberToString input is invalid.`);
    return `${input.dividedBy(1000000).toNumber()} tez`;
}
function posify(num) {
    if (num.isNegative())
        return num.negated();
    return num;
}
function get_cost(storage_difference, gas_used, bytes_size) {
    const fees = 100 + bytes_size + gas_used * 0.1;
    const burn = storage_difference * 250;
    return new bignumber_js_1.BigNumber(fees + burn).integerValue(bignumber_js_1.BigNumber.ROUND_UP);
}
const handleDelayInput = (delay) => {
    let output = 0;
    if (typeof delay == 'number')
        output = delay;
    if (typeof delay == 'string')
        output = new archetype_ts_types_1.Duration(delay).toSecond();
    if (delay instanceof archetype_ts_types_1.Duration)
        output = delay.toSecond();
    return output;
};
// with_cost function provides the cost of a transaction
const make_call_get_delta = (f, call_params) => __awaiter(void 0, void 0, void 0, function* () {
    const balance_before = yield call_params.as.get_balance();
    const res = yield f(call_params);
    // const cost = get_cost(
    //   res.paid_storage_size_diff,
    //   res.consumed_gas,
    //   res.storage_size
    // )
    const balance_after = yield call_params.as.get_balance();
    return {
        delta: balance_before.to_big_number().minus(balance_after.to_big_number()),
        call_result: res,
    };
});
function run_scenario_test(
// scenario_description: string,
call_makers, tpArray, mode = 'verbose') {
    return __awaiter(this, void 0, void 0, function* () {
        for (const tp of tpArray) {
            tp.ec_BN = new bignumber_js_1.BigNumber(tp.expected_change).times(1000000);
            tp.actual_before = (yield tp.account.get_balance()).to_big_number();
            tp.expected_direction = tp.ec_BN.isZero()
                ? 'unchanged'
                : tp.ec_BN.isPositive()
                    ? 'increase'
                    : 'decrease';
            tp.expected_amount = new archetype_ts_types_1.Tez(posify(tp.ec_BN), 'mutez').toString('tez');
            tp.accumulated_approx_cost = new bignumber_js_1.BigNumber(0);
            tp.cost_array = [];
        }
        for (const cm of call_makers) {
            if (!cm.amount)
                throw ('amount must be explicitly specified for account: ' + cm.as.get_name());
            if (!cm.as)
                throw 'account must be explicitly specified for m cms';
            const target_tp_index = tpArray.findIndex((tp) => tp.account === cm.as);
            if (target_tp_index !== -1) {
                // const ec_BN = tpArray[target_tp_index].ec_BN
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { delta, call_result } = yield make_call_get_delta(cm.call, {
                    as: cm.as,
                    amount: cm.amount,
                });
                console.log('delta: ', delta);
                const approximate_cost = get_cost(call_result.paid_storage_size_diff, call_result.consumed_gas, call_result.storage_size).dividedBy(2);
                const cost_accumulator = tpArray[target_tp_index].accumulated_approx_cost.plus(approximate_cost);
                tpArray[target_tp_index].accumulated_approx_cost = cost_accumulator;
                tpArray[target_tp_index].cost_array.push({
                    call_name: cm.name,
                    approximate_cost: approximate_cost,
                });
            }
            cm.delay_seconds = handleDelayInput(cm.delay_after);
            (0, experiment_ts_1.delay_mockup_now_by_second)(cm.delay_seconds);
        }
        for (const tp of tpArray) {
            const actual_before = tp.actual_before;
            const actual_after = (yield tp.account.get_balance()).to_big_number();
            tp.expected_after = actual_before.plus(tp.ec_BN);
            tp.expected_after_approx_costs = tp.expected_after.minus(tp.accumulated_approx_cost);
            const actual_change = actual_after.minus(actual_before);
            const actual_direction = actual_change.isZero()
                ? 'unchanged'
                : actual_change.isPositive()
                    ? 'increase'
                    : 'decrease';
            const actual_amount = tezBNtoString(posify(actual_change));
            const num_calls_this_account = tp.cost_array.length;
            const tolerance = new bignumber_js_1.BigNumber(num_calls_this_account).times(150000);
            tp.tolerance = tolerance;
            tp.actual_after = actual_after;
            tp.difference = actual_after.minus(tp.expected_after).abs();
            const actual_string = `\n\tactual: ${actual_direction} by ${actual_amount}`;
            const expected_string = `\n\texpected: ${tp.expected_direction} by ${tp.expected_amount}`;
            const end_string = `\n\t-----\n`;
            const apparent_costs_string = tp.cost_array.length > 0
                ? `\n\tapparent real total costs: ${tp.difference.toString()} mutez`
                : '';
            if (mode == 'verbose') {
                tp.info_message =
                    `\n\tSUCCESS: ${tp.account.get_name()}\n\t` +
                        actual_string +
                        apparent_costs_string +
                        end_string;
                tp.error_message =
                    `\n\tERROR: ${tp.account.get_name()}\n\t ` +
                        expected_string +
                        actual_string +
                        apparent_costs_string +
                        end_string;
            }
        }
        return tpArray;
    });
}
exports.default = run_scenario_test;
