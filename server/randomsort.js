
const randomSortSup = (arr, newArr)=> {
    if(arr.length == 1) {
        newArr.push(arr[0]);
        return newArr; // 相當於遞迴退出
    }
    // 在原陣列length基礎上取出一個隨機數
    var random = Math.ceil(Math.random() * arr.length) - 1;
    // 將原陣列中的隨機一個值push到新陣列newArr中
    newArr.push(arr[random]);
    // 對應刪除原陣列arr的對應陣列項
    arr.splice(random,1);
    return randomSortSup(arr, newArr);
}
const randomSort = (arr) => {
    
    a = arr
    b = []
    randomSortSup(a, b)
    return b
}
module.exports = randomSort

    