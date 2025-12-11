def findSum (arr, x):
    for i in range(len(arr)-1):
        for j in range(i+1, len(arr)):
            if(arr[i] + arr[j] == x):
                return True
    return False

x = findSum([1,-1, 2,3,-4], 0)
print(x)