#include <iostream>
#include <vector>
#include <cmath>
#include <sndfile.h>
#include <algorithm>
#include <fstream>
#include <cstring>

using namespace std;

const double pi = 3.14159265358979323846;

class BitWriter {
private:
    vector<uint8_t> data;
    uint8_t currentByte;
    int bitCount;

public:
    BitWriter() : currentByte(0), bitCount(0) {}

    void writeBits(int value, int numBits) {
        for (int i = numBits - 1; i >= 0; i--) {
            bool bit = (value >> i) & 1;
            currentByte = (currentByte << 1) | (bit ? 1 : 0);
            bitCount++;
            if (bitCount == 8) {
                data.push_back(currentByte);
                currentByte = 0;
                bitCount = 0;
            }
        }
    }

    void flush() {
        if (bitCount > 0) {
            currentByte <<= (8 - bitCount);
            data.push_back(currentByte);
            currentByte = 0;
            bitCount = 0;
        }
    }

    vector<uint8_t> getData() {
        flush();
        return data;
    }
};

class BitReader {
private:
    vector<uint8_t> data;
    size_t byteIndex;
    int bitIndex;

public:
    BitReader(const vector<uint8_t>& inputData) : data(inputData), byteIndex(0), bitIndex(0) {}

    int readBits(int numBits) {
        int result = 0;
        for (int i = 0; i < numBits; i++) {
            if (byteIndex >= data.size()) return 0;
            bool bit = (data[byteIndex] >> (7 - bitIndex)) & 1;
            result = (result << 1) | (bit ? 1 : 0);
            bitIndex++;
            if (bitIndex == 8) {
                bitIndex = 0;
                byteIndex++;
            }
        }
        return result;
    }

    bool hasMoreData() { return byteIndex < data.size(); }
};

vector<vector<double>> blockSplit(int N, vector<double> samples) {
    vector<vector<double>> blocks;
    samples.insert(samples.begin(), N, 0);
    for (int i = 0; i < N; i++) samples.push_back(0);

    for (size_t i = 0; i < samples.size() - N; i += N) {
        vector<double> block;
        for (int j = 0; j < 2 * N && (i + j) < samples.size(); j++) {
            block.push_back(samples[i + j]);
        }
        blocks.push_back(block);
    }
    return blocks;
}

vector<vector<double>> window(int N, vector<vector<double>> blocks) {
    vector<vector<double>> windowArray(blocks.size());
    for (size_t i = 0; i < blocks.size(); i++) {
        windowArray[i].resize(blocks[i].size());
        for (size_t j = 0; j < blocks[i].size(); j++) {
            windowArray[i][j] = blocks[i][j] * sin((pi / (2 * N)) * (j + 0.5));
        }
    }
    return windowArray;
}

vector<vector<double>> mdct(int N, vector<vector<double>> windowArray) {
    vector<vector<double>> mdctArray(windowArray.size());
    for (size_t i = 0; i < windowArray.size(); i++) {
        mdctArray[i].resize(N);
        for (int k = 0; k < N; k++) {
            double sum = 0.0;
            for (int n = 0; n < 2 * N; n++) {
                sum += windowArray[i][n] * cos((pi / N) * (n + 0.5 + N / 2.0) * (k + 0.5));
            }
            mdctArray[i][k] = sum;
        }
    }
    return mdctArray;
}

vector<vector<double>> imdct(int N, vector<vector<double>> mdctArray) {
    vector<vector<double>> imdctArray(mdctArray.size());
    for (size_t i = 0; i < mdctArray.size(); i++) {
        imdctArray[i].resize(2 * N);
        for (int n = 0; n < 2 * N; n++) {
            double sum = 0.0;
            for (int k = 0; k < N; k++) {
                sum += mdctArray[i][k] * cos((pi / N) * (n + 0.5 + N / 2.0) * (k + 0.5));
            }
            double value = (2.0 / N) * sum;
            if (fabs(value) < 1e-10) value = 0.0;
            imdctArray[i][n] = value;
        }
    }
    return imdctArray;
}

vector<vector<int>> compressMDCT(int M, int N, const vector<vector<double>>& mdctArray) {
    vector<vector<int>> compressed(mdctArray.size());
    for (size_t i = 0; i < mdctArray.size(); i++) {
        compressed[i].resize(N - M);
        for (int j = 0; j < N - M; j++) {
            compressed[i][j] = round(mdctArray[i][j]);
        }
    }
    return compressed;
}

vector<vector<double>> decompressMDCT(int M, int N, const vector<vector<int>>& compressedArray) {
    vector<vector<double>> decompressed(compressedArray.size());
    for (size_t i = 0; i < compressedArray.size(); i++) {
        decompressed[i].resize(N);
        for (size_t j = 0; j < compressedArray[i].size(); j++) {
            decompressed[i][j] = static_cast<double>(compressedArray[i][j]);
        }
        for (int j = N - M; j < N; j++) {
            decompressed[i][j] = 0.0;
        }
    }
    return decompressed;
}

vector<vector<double>> dewindow(int N, vector<vector<double>> imdctArray) {
    vector<vector<double>> dewindowArray(imdctArray.size());
    for (size_t i = 0; i < imdctArray.size(); i++) {
        dewindowArray[i].resize(imdctArray[i].size());
        for (size_t j = 0; j < imdctArray[i].size(); j++) {
            dewindowArray[i][j] = imdctArray[i][j] * sin((pi / (2 * N)) * (j + 0.5));
        }
    }
    return dewindowArray;
}

vector<double> overlapAdd(int N, vector<vector<double>> dewindowArray) {
    vector<double> result;
    for (size_t i = 0; i < dewindowArray.size() - 1; i++) {
        for (int j = 0; j < N; j++) {
            double val = dewindowArray[i][N + j] + dewindowArray[i + 1][j];
            result.push_back(val);
        }
    }
    return result;
}

vector<uint8_t> encodeBlock(const vector<int>& block) {
    BitWriter writer;
    for (int val : block) {
        int absVal = abs(val);
        int sign = (val < 0) ? 1 : 0;
        int numBits = 1;
        if (absVal > 0) {
            numBits = static_cast<int>(log2(absVal)) + 2;
        }
        if (numBits > 16) numBits = 16;
        writer.writeBits(numBits, 5);
        writer.writeBits(sign, 1);
        writer.writeBits(absVal, numBits);
    }
    return writer.getData();
}

vector<int> decodeBlock(const vector<uint8_t>& encoded, int blockSize) {
    BitReader reader(encoded);
    vector<int> block;
    for (int i = 0; i < blockSize; i++) {
        int numBits = reader.readBits(5);
        int sign = reader.readBits(1);
        int absVal = reader.readBits(numBits);
        int val = sign ? -absVal : absVal;
        block.push_back(val);
    }
    return block;
}

void writeCompressedFile(const string& filename, int numSamples, int sampleRate,
                         int N, int M, const vector<vector<uint8_t>>& blocksZ,
                         const vector<vector<uint8_t>>& blocksW) {
    ofstream file(filename, ios::binary);
    file.write(reinterpret_cast<const char*>(&numSamples), sizeof(int));
    file.write(reinterpret_cast<const char*>(&sampleRate), sizeof(int));
    file.write(reinterpret_cast<const char*>(&N), sizeof(int));
    file.write(reinterpret_cast<const char*>(&M), sizeof(int));

    int numBlocksZ = blocksZ.size();
    int numBlocksW = blocksW.size();
    file.write(reinterpret_cast<const char*>(&numBlocksZ), sizeof(int));
    file.write(reinterpret_cast<const char*>(&numBlocksW), sizeof(int));

    for (const auto& block : blocksZ) {
        int blockSize = block.size();
        file.write(reinterpret_cast<const char*>(&blockSize), sizeof(int));
        file.write(reinterpret_cast<const char*>(block.data()), blockSize);
    }
    for (const auto& block : blocksW) {
        int blockSize = block.size();
        file.write(reinterpret_cast<const char*>(&blockSize), sizeof(int));
        file.write(reinterpret_cast<const char*>(block.data()), blockSize);
    }
    file.close();
}

void printUsage(const char* progName) {
    cerr << "Usage: " << progName << " <input.wav> <output.wav> <N> <M>" << endl;
    cerr << "  N: Block size (e.g., 1024, 2048)" << endl;
    cerr << "  M: Coefficients to discard (higher = more compression, lower quality)" << endl;
    cerr << "  Recommended: N=1024, M=50-200" << endl;
}

int main(int argc, char* argv[]) {
    if (argc != 5) {
        printUsage(argv[0]);
        return 1;
    }

    string inputFile = argv[1];
    string outputFile = argv[2];
    int N = atoi(argv[3]);
    int M = atoi(argv[4]);

    if (N <= 0 || M < 0 || M >= N) {
        cerr << "Error: Invalid N or M values. N must be > 0, M must be >= 0 and < N" << endl;
        return 1;
    }

    SF_INFO sfinfo;
    memset(&sfinfo, 0, sizeof(sfinfo));
    SNDFILE* inFile = sf_open(inputFile.c_str(), SFM_READ, &sfinfo);
    
    if (!inFile) {
        cerr << "Error: Cannot open input file: " << inputFile << endl;
        return 1;
    }

    int numSamples = sfinfo.frames;
    int sampleRate = sfinfo.samplerate;
    int channels = sfinfo.channels;

    vector<short> rawSamples(numSamples * channels);
    sf_read_short(inFile, rawSamples.data(), rawSamples.size());
    sf_close(inFile);

    vector<double> leftChannel(numSamples);
    vector<double> rightChannel(numSamples);

    if (channels == 2) {
        for (int i = 0; i < numSamples; i++) {
            leftChannel[i] = rawSamples[i * 2];
            rightChannel[i] = rawSamples[i * 2 + 1];
        }
    } else {
        for (int i = 0; i < numSamples; i++) {
            leftChannel[i] = rawSamples[i];
            rightChannel[i] = rawSamples[i];
        }
    }

    // Mid-Side encoding
    vector<double> midChannel(numSamples);
    vector<double> sideChannel(numSamples);
    for (int i = 0; i < numSamples; i++) {
        midChannel[i] = (leftChannel[i] + rightChannel[i]) / 2.0;
        sideChannel[i] = (leftChannel[i] - rightChannel[i]) / 2.0;
    }

    // Process mid channel
    auto blocksMid = blockSplit(N, midChannel);
    auto windowedMid = window(N, blocksMid);
    auto mdctMid = mdct(N, windowedMid);
    auto compressedMid = compressMDCT(M, N, mdctMid);

    // Process side channel
    auto blocksSide = blockSplit(N, sideChannel);
    auto windowedSide = window(N, blocksSide);
    auto mdctSide = mdct(N, windowedSide);
    auto compressedSide = compressMDCT(M, N, mdctSide);

    // Encode
    vector<vector<uint8_t>> encodedMid, encodedSide;
    for (const auto& block : compressedMid) encodedMid.push_back(encodeBlock(block));
    for (const auto& block : compressedSide) encodedSide.push_back(encodeBlock(block));

    // Decode
    vector<vector<int>> decodedMid, decodedSide;
    int blockSize = N - M;
    for (const auto& encoded : encodedMid) decodedMid.push_back(decodeBlock(encoded, blockSize));
    for (const auto& encoded : encodedSide) decodedSide.push_back(decodeBlock(encoded, blockSize));

    // Decompress
    auto decompressedMid = decompressMDCT(M, N, decodedMid);
    auto decompressedSide = decompressMDCT(M, N, decodedSide);

    // Inverse MDCT
    auto imdctMid = imdct(N, decompressedMid);
    auto imdctSide = imdct(N, decompressedSide);

    // Dewindow
    auto dewindowedMid = dewindow(N, imdctMid);
    auto dewindowedSide = dewindow(N, imdctSide);

    // Overlap-add
    auto reconstructedMid = overlapAdd(N, dewindowedMid);
    auto reconstructedSide = overlapAdd(N, dewindowedSide);

    // Mid-Side decoding
    size_t minSize = min(reconstructedMid.size(), reconstructedSide.size());
    vector<double> reconstructedL(minSize);
    vector<double> reconstructedR(minSize);
    for (size_t i = 0; i < minSize; i++) {
        reconstructedL[i] = reconstructedMid[i] + reconstructedSide[i];
        reconstructedR[i] = reconstructedMid[i] - reconstructedSide[i];
    }

    // Write output
    SF_INFO outInfo;
    outInfo.samplerate = sampleRate;
    outInfo.channels = 2;
    outInfo.format = SF_FORMAT_WAV | SF_FORMAT_PCM_16;

    SNDFILE* outFile = sf_open(outputFile.c_str(), SFM_WRITE, &outInfo);
    if (!outFile) {
        cerr << "Error: Cannot create output file: " << outputFile << endl;
        return 1;
    }

    vector<short> interleavedOutput(minSize * 2);
    for (size_t i = 0; i < minSize; i++) {
        double clampedL = max(-32768.0, min(32767.0, reconstructedL[i]));
        double clampedR = max(-32768.0, min(32767.0, reconstructedR[i]));
        interleavedOutput[i * 2] = static_cast<short>(round(clampedL));
        interleavedOutput[i * 2 + 1] = static_cast<short>(round(clampedR));
    }

    sf_write_short(outFile, interleavedOutput.data(), interleavedOutput.size());
    sf_close(outFile);

    // Calculate compression stats
    size_t originalSize = numSamples * channels * sizeof(short);
    size_t compressedSize = 0;
    for (const auto& block : encodedMid) compressedSize += block.size();
    for (const auto& block : encodedSide) compressedSize += block.size();

    cout << "Compression complete:" << endl;
    cout << "  Input: " << inputFile << endl;
    cout << "  Output: " << outputFile << endl;
    cout << "  Original size: " << originalSize << " bytes" << endl;
    cout << "  Compressed size: " << compressedSize << " bytes" << endl;
    cout << "  Ratio: " << (double)originalSize / compressedSize << ":1" << endl;

    return 0;
}