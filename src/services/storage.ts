import AsyncStorage from "@react-native-async-storage/async-storage"
import { Produto } from "../types/Produto"


const TASKS_KEY = '@todo_app:tasks';

export const saveProdutos = async (Produto: Produto[]): Promise<void> => {
    const jsonValue = JSON.stringify(Produto);
    await AsyncStorage.setItem(TASKS_KEY, jsonValue);
};

export const loadProdutos = async (): Promise<Produto[]> => {
    try {
        const jsonValue = await AsyncStorage. getItem(TASKS_KEY);

        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch(error) {
        console.log('Erro ao carregar tarefas do AsyncStorage', error)
        return[]
    }
}