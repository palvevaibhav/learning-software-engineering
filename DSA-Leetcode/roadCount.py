def findRoadCount(arr, n):
    if n == 0:
        return 0
    maxValue = float('-inf')
    for i in range(1, n + 1):
        cost = arr[i-1] + findRoadCount(arr, n-i)
        if cost > maxValue:
            maxValue = cost
    return maxValue

if __name__ == "__main__":
    nums = [1, 5, 8, 9, 10, 17, 17, 20]
    target = 4
    a = findRoadCount(nums, target)
    print(a)
