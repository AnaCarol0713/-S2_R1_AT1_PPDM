import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, FlatList, Modal, Image } from "react-native";
import { useState, useEffect } from "react";
import { Produto, FilterType } from "../types/Produto";
import { saveProdutos, loadProdutos } from "../services/storage";

export default function Home() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newQuantidade, setNewQuantidade] = useState<number | string>(""); 
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterType>('todos');

  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

  const totalCount = produtos.length;
  const completedCount = produtos.filter((p) => p.completed).length;
  const pendingCount = totalCount - completedCount;

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setIsLoading(true);
      const savedProdutos = await loadProdutos();
      setProdutos(savedProdutos);
    } catch (error) {
      console.error("Erro ao inicializar produtos: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateId = (produtosList: Produto[]) => {
    const nextId = produtosList.length === 0 ? 1 : Math.max(...produtosList.map(produto => Number(produto.id))) + 1;
    return String(nextId).padStart(3, "0");
  };

  const handleAddProduto = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Atenção", "Digite o nome do produto.");
      return;
    }

    const newProduto: Produto = {
      id: generateId(produtos),
      title: newTitle.trim(),
      quantidade: Number(newQuantidade), 
      completed: false,
      createdAt: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const updatedProdutos = [newProduto, ...produtos];
    setProdutos(updatedProdutos);
    await saveProdutos(updatedProdutos);
    
    setNewTitle("");
    setNewQuantidade("");
  };

  const handleOpenEditModal = (produto: Produto) => {
    setEditingProduto(produto);
    setEditTitle(produto.title);
  };

  const handleSaveEdit = async () => {
    if (!editingProduto) return;
    if (!editTitle.trim()) {
      Alert.alert("Atenção", "O título não pode ser vazio!");
      return;
    }

    const updatedList = produtos.map((produto) => 
      produto.id === editingProduto.id ? { ...produto, title: editTitle.trim() } : produto
    );

    setProdutos(updatedList);
    setEditingProduto(null);
    setEditTitle('');
    await saveProdutos(updatedList);
  };

  const handleDeleteProdutoWeb = async (id: string) => {
    const confirmed = window.confirm(
      'Tem certeza de que deseja excluir este produto?'
    );

    if (confirmed) {
      const updatedList = produtos.filter((produto) => produto.id !== id);
      setProdutos(updatedList);
      await saveProdutos(updatedList);
    }
  };

  const handleToggleProduto = async (id: string) => {
    const updatedList = produtos.map((produto) =>
      produto.id === id ? { ...produto, completed: !produto.completed } : produto
    );

    setProdutos(updatedList);
    await saveProdutos(updatedList);
  };

  const filteredProdutos = produtos.filter((produto) => {
    if (filter === 'pendentes') return !produto.completed;
    if (filter === 'concluidas') return produto.completed;
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Lista de Compras</Text>
          <Image
            source={require('../images/compras2.png')}
            style={styles.headerImageSide}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.headerSubtitle}>Persistência Local com AsyncStorage</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statBadge, styles.statBadgePending]}>
            <Text style={[styles.statNumber, styles.statNumberPending]}>
              {pendingCount}
            </Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={[styles.statBadge, styles.statBadgeCompleted]}>
            <Text style={[styles.statNumber, styles.statNumberCompleted]}>
              {completedCount}
            </Text>
            <Text style={styles.statLabel}>Concluídas</Text>
          </View>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputTitle}
          placeholder="Nome do produto..."
          placeholderTextColor="#94A3B8"
          value={newTitle}
          onChangeText={setNewTitle}
        />

        <TextInput
          style={styles.inputQuantidade}
          placeholder="Digite a quantidade..."
          placeholderTextColor="#94A3B8"
          value={String(newQuantidade)}
          onChangeText={(v) => {
            const valorConvertido = Number(v) || "";
            setNewQuantidade(valorConvertido);
          }}
          onSubmitEditing={handleAddProduto}
          returnKeyType="done"
        />
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduto} activeOpacity={0.8}>
          <Text style={styles.textAddButton}>Adicionar +</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {(['todos', 'pendentes', 'concluidas'] as FilterType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterTab,
              filter === type && styles.filterTabActive,
            ]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === type && styles.filterTabTextActive,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Carregando compras....</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProdutos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, item.completed && styles.cardCompleted]}>
              <TouchableOpacity
                style={[styles.checkbox, item.completed && styles.checkboxChecked]}
                onPress={() => handleToggleProduto(item.id)}
                activeOpacity={0.7}
              >
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              <View style={styles.textContainer}>
                <Text
                  style={[styles.title, item.completed && styles.titleCompleted]}
                  numberOfLines={2}
                >
                  {item.title} <Text style={styles.quantidadeText}>(Qtd: {item.quantidade})</Text>
                </Text>
                <Text style={styles.dateText}>Criada em: {item.createdAt}</Text>
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  activeOpacity={0.7}
                  onPress={() => handleOpenEditModal(item)}
                >
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  activeOpacity={0.7}
                  onPress={() => handleDeleteProdutoWeb(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhum item encontrado</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={editingProduto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingProduto(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar compra</Text>
            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Novo título..."
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setEditingProduto(null)}
              >
                <Text style={styles.cancelModalText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveModalText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#7f1734",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#E0E7FF",
    marginTop: 2,
    marginBottom: 16
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statBadgePending: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
  },
  statBadgeCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.25)',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statNumberPending: {
    color: '#ff6a00ff',
  },
  statNumberCompleted: {
    color: '#A7F3D0',
  },
  statLabel: {
    fontSize: 11,
    color: '#F8FAFC',
    marginTop: 2,
  },
  titleContainer: {
    flexDirection: 'row',   
    alignItems: 'center',  
  },
  headerImageSide: {
    width: 70,               
    height: 70,             
    marginLeft: 10,       
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8
  },
  inputTitle: {
    flex: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  inputQuantidade: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlign: "center"
  },
  addButton: {
    backgroundColor: "#8B0000",
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  textAddButton: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 18
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#800000',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#a70101ff',
  },
  cardCompleted: {
    backgroundColor: '#F8FAFC',
    borderLeftColor: '#10B981',
    opacity: 0.85,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  quantidadeText: {
    fontSize: 13,
    color: '#7f1734',
    fontWeight: 'normal'
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8'
  },
  listContent: {
    padding: 16
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 32
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 16
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 6
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  editButton: {
    backgroundColor: '#E2E8F0'
  },
  editButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: 'bold'
  },
  deleteButton: {
    backgroundColor: '#FEE2E2'
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  cancelModalButton: {
    backgroundColor: '#E2E8F0'
  },
  cancelModalText: {
    color: '#475569'
  },
  saveModalButton: {
    backgroundColor: '#800000'
  },
  saveModalText: {
    color: '#FFF',
    fontWeight: 'bold'
  }
});