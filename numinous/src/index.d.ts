import { Account, Parameters } from '@completium/experiment-ts';
import { BigNumber } from 'bignumber.js';
import { Tez, CallResult, Duration } from '@completium/archetype-ts-types';
interface costObject {
    call_name: string;
    approximate_cost: BigNumber;
}
interface testParams {
    name: string;
    description: string;
    account: Account;
    expected_change: number;
    ec_BN: BigNumber;
    expected_direction: 'increase' | 'decrease' | 'unchanged';
    expected_amount: string;
    actual_before: BigNumber;
    info_message: string;
    error_message: string;
    accumulated_approx_cost: BigNumber;
    cost_array: costObject[];
    actual_after: BigNumber;
    expected_after: BigNumber;
    expected_after_approx_costs: BigNumber;
    difference: BigNumber;
    tolerance: BigNumber;
}
interface CallMaker {
    name: string;
    description: string;
    as: Account;
    amount: Tez;
    call: (call_params: Parameters) => Promise<CallResult>;
    delay_after: number | Duration | string;
    delay_seconds: number;
}
declare function run_scenario_test(call_makers: CallMaker[], tpArray: Array<testParams>, mode?: 'verbose' | 'quiet'): Promise<testParams[]>;
export default run_scenario_test;
