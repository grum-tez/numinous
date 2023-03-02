import { ArchetypeType, Rational, Duration, date_cmp, Tez, Bytes, Address, Nat, Enum, CallResult } from '@completium/archetype-ts-types';
import {get_account, set_mockup, set_mockup_now, set_quiet, Account, Parameters, delay_mockup_now_by_minute, delay_mockup_now_by_week, delay_mockup_now_by_second, expect_to_fail} from "@completium/experiment-ts";
import { BigNumber } from 'bignumber.js'

export const Greeter = (name: string) => `Hello ${name}`;


export interface costObject {
  call_name: string,
  approximate_cost: BigNumber,
}

export interface testParams {
  name: string,
  description: string,
  account : Account,
  expected_change: number,
  ec_BN: BigNumber, // expected_change as BigNumber
  expected_direction: "increase" | "decrease" | "unchanged",
  expected_amount: string,
  actual_before: BigNumber,
  info_message: string,
  error_message: string,
  accumulated_approx_cost: BigNumber,
  cost_array: costObject[],
  actual_after: BigNumber,
  expected_after: BigNumber,
  expected_after_approx_costs: BigNumber,
  difference: BigNumber,
  tolerance: BigNumber,
}

export interface CallMaker {
  name: string,
  description: string,
  as: Account,
  amount: Tez,
  call: (call_params: Parameters) => Promise<any>
  delay_after: number | Duration | string,
  delay_seconds: number,
}
