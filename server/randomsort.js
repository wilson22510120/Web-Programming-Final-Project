
const randomSortSup = (arr, newArr)=> {
    if(arr.length == 1) {
        newArr.push(arr[0]);
        return newArr; // �۷�󻼰j�h�X
    }
    // �b��}�Clength��¦�W���X�@���H����
    var random = Math.ceil(Math.random() * arr.length) - 1;
    // �N��}�C�����H���@�ӭ�push��s�}�CnewArr��
    newArr.push(arr[random]);
    // �����R����}�Carr�������}�C��
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

    