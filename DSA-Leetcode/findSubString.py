# Input: s = "abcabcbb"
# Output: 3

def subString(s):
    # obj = set()
    # l = 0 
    # res = 0
    # for i in range(len(s)):
    #     while s[i] in obj:
    #         obj.remove(s[i]) 
    #         l+=1
    #     obj.add(s[i])
    #     res = max(res, i - l +1)
    # return res

    sub = {}
    cur_sub_start = 0
    longest = 0   
    for i, letter in enumerate(s):
        if letter in sub and sub[letter] >= cur_sub_start:
            cur_sub_start = sub[letter] + 1
        sub[letter] = i
        cur_len = i - cur_sub_start + 1
        longest = max(longest, cur_len)
    
    return longest

if __name__=="__main__":
    string = "abcabcbb"
    p = subString(string)
    print(p)