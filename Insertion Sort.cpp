#include <iostream>
#include <chrono>

using namespace std;
void Insertion_sort(int data[], int len);
void display(int data[], int len);


int main()
{

    int data[10] = { 35, 52, 68, 12, 47, 52, 36, 52, 74, 27 };
    cout << "Origin Data:";
    display(data, 10);

    auto start = chrono::high_resolution_clock::now();
    Insertion_sort(data, 10);
    auto end = chrono::high_resolution_clock::now();

    cout << "Sorted Data:";
    display(data, 10);
    
    chrono::duration<double> elapsed_time = end - start;
    cout << "Run_time:" << elapsed_time.count() << " sec" << endl;
}

void Insertion_sort(int data[], int len) {
    int value, j;

    for (int i = 1; i < len; i++)
    {
        value = data[i];
        j = i - 1;

        while (value < data[j] && j >= 0) {
            data[j + 1] = data[j];
            j --;
        }

        data[j + 1] = value;
    }

}
void display(int data[], int len)
{
    for (int i = 0; i < len; i++)
        cout << data[i] << " ";
    cout << endl;
}


