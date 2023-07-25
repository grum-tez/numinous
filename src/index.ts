import {
  Account,
  Parameters,
  delay_mockup_now_by_second,
} from '@completium/experiment-ts'
import { BigNumber } from 'bignumber.js'
import { Tez, CallResult, Duration } from '@completium/archetype-ts-types'

interface costObject {
  call_name: string
  approximate_cost: BigNumber
}

interface testParams {
  name: string
  description: string
  account: Account
  expected_change: number
  ec_BN: BigNumber // expected_change as BigNumber
  expected_direction: 'increase' | 'decrease' | 'unchanged'
  expected_amount: string
  actual_before: BigNumber
  info_message: string
  error_message: string
  accumulated_approx_cost: BigNumber
  cost_array: costObject[]
  actual_after: BigNumber
  expected_after: BigNumber
  expected_after_approx_costs: BigNumber
  difference: BigNumber
  tolerance: BigNumber

  // variable_function:
  // variable_before: any,
  // variable_after: any,
}

interface CallMaker {
  name: string
  description: string
  as: Account
  amount: Tez
  call: (call_params: Parameters) => Promise<CallResult>
  delay_after: number | Duration | string
  delay_seconds: number
}

export function tezBNtoString(input: BigNumber) {
  if (input === new BigNumber(0)) return `0 tez`
  if (!input) throw Error(`tezBigNumberToString input is invalid.`)
  return `${input.dividedBy(1000000).toNumber()} tez`
}

export function posify(num: BigNumber): BigNumber {
  if (num.isNegative()) return num.negated()
  return num
}

function get_cost(
  //This function is very very wrong
  storage_difference: number,
  gas_used: number,
  bytes_size: number
): BigNumber {
  const fees = 100 + bytes_size + gas_used * 0.1
  const burn = storage_difference * 250
  return new BigNumber(fees + burn).integerValue(BigNumber.ROUND_UP)
}

const handleDelayInput = (delay: number | Duration | string): number => {
  let output = 0
  if (typeof delay == 'number') output = delay
  if (typeof delay == 'string') output = new Duration(delay).toSecond()
  if (delay instanceof Duration) output = delay.toSecond()
  return output
}

interface MCGTout {
  delta: BigNumber
  call_result: CallResult
}

// with_cost function provides the cost of a transaction
const make_call_get_delta = async (
  f: { (call_params: Parameters): Promise<CallResult> },
  call_params: Parameters
): Promise<MCGTout> => {
  const balance_before = await call_params.as.get_balance()
  const res = await f(call_params)
  // const cost = get_cost(
  //   res.paid_storage_size_diff,
  //   res.consumed_gas,
  //   res.storage_size
  // )
  const balance_after = await call_params.as.get_balance()
  return {
    delta: balance_before.to_big_number().minus(balance_after.to_big_number()),
    call_result: res,
  }
}

export async function run_scenario_test(
  // scenario_description: string,
  call_makers: CallMaker[],
  tpArray: Array<testParams>,
  mode: 'verbose' | 'quiet' = 'verbose'
): Promise<testParams[]> {
  for (const tp of tpArray) {
    tp.ec_BN = new BigNumber(tp.expected_change).times(1000000)
    tp.actual_before = (await tp.account.get_balance()).to_big_number()
    tp.expected_direction = tp.ec_BN.isZero()
      ? 'unchanged'
      : tp.ec_BN.isPositive()
      ? 'increase'
      : 'decrease'
    tp.expected_amount = new Tez(posify(tp.ec_BN), 'mutez').toString('tez')
    tp.accumulated_approx_cost = new BigNumber(0)
    tp.cost_array = []
  }

  for (const cm of call_makers) {
    if (!cm.amount)
      throw (
        'amount must be explicitly specified for account: ' + cm.as.get_name()
      )
    if (!cm.as) throw 'account must be explicitly specified for m cms'
    const target_tp_index = tpArray.findIndex((tp) => tp.account === cm.as)
    if (target_tp_index !== -1) {
      // const ec_BN = tpArray[target_tp_index].ec_BN
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { delta, call_result } = await make_call_get_delta(cm.call, {
        as: cm.as,
        amount: cm.amount,
      })
      console.log('delta: ', delta)
      const approximate_cost = get_cost(
        call_result.paid_storage_size_diff,
        call_result.consumed_gas,
        call_result.storage_size
      ).dividedBy(2)
      const cost_accumulator =
        tpArray[target_tp_index].accumulated_approx_cost.plus(approximate_cost)
      tpArray[target_tp_index].accumulated_approx_cost = cost_accumulator
      tpArray[target_tp_index].cost_array.push({
        call_name: cm.name,
        approximate_cost: approximate_cost,
      })
    }
    cm.delay_seconds = handleDelayInput(cm.delay_after)
    delay_mockup_now_by_second(cm.delay_seconds)
  }
  for (const tp of tpArray) {
    const actual_before = tp.actual_before
    const actual_after = (await tp.account.get_balance()).to_big_number()
    tp.expected_after = actual_before.plus(tp.ec_BN)
    tp.expected_after_approx_costs = tp.expected_after.minus(
      tp.accumulated_approx_cost
    )
    const actual_change = actual_after.minus(actual_before)
    const actual_direction = actual_change.isZero()
      ? 'unchanged'
      : actual_change.isPositive()
      ? 'increase'
      : 'decrease'
    const actual_amount = tezBNtoString(posify(actual_change))

    const num_calls_this_account = tp.cost_array.length

    const tolerance = new BigNumber(num_calls_this_account).times(150000)
    tp.tolerance = tolerance
    tp.actual_after = actual_after
    tp.difference = actual_after.minus(tp.expected_after).abs()

    const actual_string = `\n\tactual: ${actual_direction} by ${actual_amount}`
    const expected_string = `\n\texpected: ${tp.expected_direction} by ${tp.expected_amount}`
    const end_string = `\n\t-----\n`

    const apparent_costs_string =
      tp.cost_array.length > 0
        ? `\n\tapparent real total costs: ${tp.difference.toString()} mutez`
        : ''

    if (mode == 'verbose') {
      tp.info_message =
        `\n\tSUCCESS: ${tp.account.get_name()}\n\t` +
        actual_string +
        apparent_costs_string +
        end_string

      tp.error_message =
        `\n\tERROR: ${tp.account.get_name()}\n\t ` +
        expected_string +
        actual_string +
        apparent_costs_string +
        end_string
    }
  }
  return tpArray
}

export default run_scenario_test
