PSEUDOCODE ML MODEL 

# Layout of Folder 

turtle-analytics/
├── README.md
├── .gitignore
├── requirements.txt
├── pyproject.toml
├── configs/
│   └── default.yaml
├── turtle_analytics/
│       ├── __init__.py
│       ├── settings.py
│       ├── io.py
│       ├── features.py
│       ├── policies.py
│       ├── simulator.py
│       ├── optimization.py
│       ├── survival.py
│       ├── clustering.py
│       ├── reporting.py
│       └── utils.py
├── scripts/
│   └── run_pipeline.py
├── data/
│   ├── raw/
│   └── processed/
├── artifacts/
├── tests/
│   ├── __init__.py
│   ├── test_simulator.py
│   ├── test_optimization.py
│   └── test_clustering.py
└── notebooks/
    └── exploration.ipynb

-------------------------------------------------------------------------------------
io.py => input/output 
defines schema that all the inpout must follow 

import pandas 

define spec of the columns for all the varbiables as a class 
- name 
- datatype 
- required 
- description 

define the required trade columns such as: 
- entry_type 
- exit_time 
- side 
- entry price 
- exit price 
- stop-loss
- take-profit 
(this is all the data that needs to be given - if not present return error)

define optional trade columns 
- mfe 
- mae 
- session 
- spread 
- volatilitgy 
- symbol 

all_columns = required + optional 
defined as dictionairy 

load_csv function : takes path as paramter 
{
    - if the path doesnt exist return file not found error 
    - try reading the file cover failures with (try, except)
    - check if empty and return error if empty 
    - strip whitecases of the columns 
    return the dataframe (df)
}

_coerce_column function : takes df and spec as paramters 
{
    check everything in the right format
}

validate_trades function : takes df as paramter 
{
    - check if theres is anything missing in required columns => return ValueError 
    - only keep the columns that are known (no NaN) 
    - make the side strings all the same: UPPERCASE 

    - drop rows with NaNs in required columns (not enouygh data to analyze)
    - drop rows with zero or underfined risk return warning

    - reset index of df +> return df 

}

-------------------------------------------------------------------------------------
features.py => basic features 
this file adds columns that downstream modules 

import pandas 

add_basic_features function : takes df as paramter 
{
    - double check that time colunmns are in datetime format 
    - calculate risk per trade {|entry price - stop loss|} basic +> change later 
    - define whether the trade is LONG/SHORT give boolean value to is_long or is_short 
    - find duration in minutes 

    returns dataframe with added columns 
}

add_extended_features function : takes df as paramter 
{
    - find realised vs potentiatl r using MFE and MAE 
    {mfeR = MFE / R}
    {maeR = MAE / R}

    - find time a day buckets and what session is open 
    {Unknown, London, NY, Overnight, US, Japan} !!Needs changing!! 

    - check whether volatility was high or low 
    {0.33, 0.66 edges for high, medium, low}
}

-------------------------------------------------------------------------------------
policy.py => preset policies for simulation (can also be called rules)

Policy_paramters: 
- sl_mult => stop loss multiplier {base 1.0 | type float}
- tp_mult => take profit multiplier {base 1.0 | type float}
- max_hold_minutes => maxiumum of minutes to be held {base : None | type int}
- trail_pct => trail percentage {base 0.0 | type float}
- risk_fraction => fraction of capital used/risked {base 0.01 (1%) | type float}

__post_init_ function : takes self (the Policy paramters) as parameter 
{
    - check if all the paramters are valid: raise Value Error otherwise 
    {sl_mult, tp_mult, max_hold_minutes can not <= 0 | 0 < trail_pct < 1 | risk > 0.2 returns warning }

    - initialise otherwise
}

to_dict function: takes self as parameter 
{
    - return the policy parameters converted as a dictionairy 
}

from_dict function : takes cls and data as paramters 
{
    - returns cls(**data)
}

__repr__ function : takes self as a paramter 
{
    - outputs the data that every paramter is running represents as string 
} 

store the preset policies: 
- conservative policy 
- agressive policy 
- scalp policy 

-------------------------------------------------------------------------------------
simulator.py => run a simulation with different setting to see how it performs 

import pandas 
import numpy 
import Policy_paramters 

run_simulation function : takers df, policy, inplace as paramters 
{
    - validate required columns again - might not be necessary 
    
    - check for MAE / MFE for better simulations 
    - if they are not present send out a warning 

    - seperate LONG and SHORT for vectorized operations 
    {
        when LONG: 
        - original_risk = entry price - stop loss
        - new_stop_loss = entry_price - (original_risk * sl multiplier)
        - original_tp_distance = entry price - take profit 
        - new_tp = entry price + (original tp distance * tp_mult)

        when SHORT 
        - original_risk = stop loss - entry_price 
        - new_stop_loss = entry_price + (original_risk * sl multiplier)
        - original_tp_distance = entry_price - take_profit 
        - new_tp = entry_price - (original_tp_distance * tp_mult)

    }

    - intialise the new sl and tp with NaN 
    - find all teh values for long and short 

    - determine simulated exit prices and reasons 

    if there is MAE and MFE{
        # For LONG trades:
        #   - SL is hit if MAE (negative) goes below SL
        #   - TP is hit if MFE (positive) reaches TP
        #   - MAE in data is likely negative or absolute, need to check
        #   - Peak price = entry_price + mfe
        #   - Trough price = entry_price - |mae|
        
        # For SHORT trades:
        #   - SL is hit if MFE goes above SL
        #   - TP is hit if MAE reaches TP (goes down enough)
        #   - Peak price = entry_price - |mae|
        #   - Trough price = entry_price + mfe (for short, mfe is favorable downward movement)
        
    }

    - apply trailing stops 
    - apply time bases exits 

    - calculate simulated PnL => might need changed 
}


calculate_policy_metrics function : takes df as a parameter 
{
    Calculuates the aggregate performance metrics from simulated trades 
    computes summary statistics that describe the overall performance of a policy of all trades

    - remove all NaN values ( can be taken out probably)


}

compare_original_vs_simulated functon : takes df as a parameter and returns a dict 
{
    - compare original results with the simulated results 
    - check if theres any missing in the required columns (return ValueError if there is missing)
    
    - if there is no valid dataframes return 0 fo reverything 

    - fetch data from original risk and simulated 
    - fetch data from original winrate and simulated winrate 

    - find the percentage of trades where the outcome changed 

    return all values 
}

run_counterfactuals function : takes df, param_grid, n_random, random_seed as paramaters 
{
    run counterfcatual simulations across multiple policy configurations 
    performs a grid search or random search over policy paramter space to find which configurations would have performed historically 


    - default the grid if none is provided 

    - generate the policy configuration bu using random search 

    - run the simulation for each policy and collect the results 

    - convert to dataframe and sort by avg R 

    return the results 

}

_generate_grid_policies function: takes param_grid as a parameter 
{
    - get paramter names and value lists 
    
    - generate all combinations 

    return policies 
}

_generate_random policies function : takes param_grid as paramter 
{
    - convert ranges to arrays for sampling 

    - sample random values (Skip invalid combinations)

    - return values if it generated less policies than attempts 

    return the polciies 

}

save_counterfactual_results function : takes results_df, output_path, format, top_n as paramters 
{
    save the counterfactual simulation results to the disk 
    (in JSON format for now, possible to change kater)

}

-------------------------------------------------------------------------------------
optimisation.py => Bayesian optimisation 

module implement smart parameter search using Optuna for Bayesian optimisation 
Unlike grid search which tests all combinations, Bayesian optimisation explores paramter space, focusing on what might be more promising 
# have both grid search and bayesian, but we do not need both can remove one later 

import pandas 
import numpy 

- try importing optuna and return error if not on computer # need to add to requirement.txt 

import from policies 
from simulator import run_simulation, calculate_policy_metrics 

optimise-policy function : takes df, config, verbose as parameters 
# verbose just means if its active 
function returns a tuple => tuple[PolicyParams, pd.dataframe, dict]
{
    find optimal policy paramter using Bayesian optimisation 

    - extract config 
    
    objective function : takes trial as paramters (trial: optuna.Trial)
    {
        - sample parameters from the search space 
        - create a PolicyParams object 
        - run simultation with that policy 
        - calculates metrics 
        - returns objective value
    }

    - create study 

    - run optimisation 

    - extract the results and get the best policy 

    - create a summary 

}

estimate_uncertainty_bootsstrap function : takes df, policiesm n_bootstrap, confidence_level, random_seed, verbose as parameters 
{
    uses boostrap resampling to estimate unceertainty in policy performance 
    bootstrap resampling: samples trades with replacement and re-evaluates each policy to estimate the distribution of outcomes 
    this gives confidence intervals for the true performance 

}

save_optimsation_results fucntion: takes best_policy, trials_df, study_summary, unceertainty_df, output_dir, verbose as paramters 
{
    - saves optimisation results to disk 
    - saves multiple files {
        - optimsation_trials.csv "All the trails with paramters and materics"
        - optimisation_trials.json "Same as JSON"
        - best_policy.json "Best policy with confidence intervals"
    }
}

load_optimisation config function : takes, config_path as paramter 
{
    Load optimisation configuartion from YAML file 
}



















