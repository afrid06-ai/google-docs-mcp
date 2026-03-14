# Amazon Flash Sale: Minimum Cost Subarray with Adjacent Difference Constraint

## Problem

Given N product prices and window size K, find the **minimum cost** contiguous subarray of size K where **no two adjacent products** have a price difference > threshold T.

**Input:** `prices = [10, 12, 15, 11, 9, 8, 7, 20]`, `K = 3`, `T = 4`  
**Output:** `24` → subarray `[9, 8, 7]`, diffs = [1, 1] ≤ 4 ✓

**Constraints:** 1 ≤ K ≤ N ≤ 10^5, 0 ≤ T ≤ 10^4

---

## Solution (Python)

```python
def min_cost_subarray(prices, K, T):
    """Find min sum contiguous subarray of size K with adjacent diff ≤ T."""
    n = len(prices)
    if n < K:
        return -1

    min_sum = float('inf')
    for i in range(n - K + 1):
        window = prices[i : i + K]
        valid = True
        for j in range(len(window) - 1):
            if abs(window[j + 1] - window[j]) > T:
                valid = False
                break
        if valid:
            min_sum = min(min_sum, sum(window))

    return min_sum if min_sum != float('inf') else -1

# Example
prices = [10, 12, 15, 11, 9, 8, 7, 20]
K, T = 3, 4
print(min_cost_subarray(prices, K, T))  # 24 → [9, 8, 7]
```

---

## Explanation

### 1. Sliding Window
We slide a window of size K over the array. For each position `i`, we consider the subarray `prices[i : i+K]`.

### 2. Validity Check
For each window, check that every adjacent pair satisfies `|prices[j+1] - prices[j]| ≤ T`. If any pair exceeds T, skip this window.

### 3. Cost = Sum
The cost of a window is the sum of its elements. We keep the **minimum sum** among all valid windows.

### 4. Example Walkthrough

| Window       | Adjacent Diffs | All ≤ 4? | Sum |
|-------------|----------------|----------|-----|
| [10, 12, 15]| 2, 3           | ✓        | 37  |
| [12, 15, 11]| 3, 4           | ✓        | 38  |
| [15, 11, 9] | 4, 2           | ✓        | 35  |
| [11, 9, 8]  | 2, 1           | ✓        | 28  |
| [9, 8, 7]   | 1, 1           | ✓        | **24** ← minimum |
| [8, 7, 20]  | 1, 13          | ✗ (13 > 4) | — |

### 5. Complexity
- **Time:** O(N × K)  
- **Space:** O(1)
