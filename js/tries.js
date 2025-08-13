/*------------------------------------------ TRIE NODE ---------------------------------------------*/
class TrieNode{
    constructor(){
        this.children = Array(10).fill(null);
        this.parent = null;
    }
}

/*------------------------------------------ CONTACT NODE ---------------------------------------------*/
class ContactNode{
    constructor(name, number, parent){
        this.name = name;
        this.number = number;
        this.parent = parent;
    }
}

/*----------------------------------------------- TRIE -----------------------------------------------*/
class Trie {

    //////////////////////////////////////////////////////// DEFAULT TRIE
    constructor(){
        this.root = new TrieNode();
        this.current = this.root;
        this.nameIndex = new Map(); // Index for name-based search

        let init = [
            ["Yogesh", "1234"],
            ["Hritik", "1243"],
            ["Rahul", "1324"],
            ["Nishant", "1342"]
        ];

        for(let i=0;i<init.length;i++){
            this.add(init[i][1], init[i][0], 0);
        }
    }

    ///////////////////////////////////////////////////////// ADD NEW CONTACT IN THE TRIE
    add(number, name, pos = 0, node = this.root){
        console.log(`Adding contact: ${name} (${number}) at position ${pos}`);
        
        if(pos===number.length-1){
            console.log(`Reached end of number, creating ContactNode for ${name} (${number})`);
            node.children[number[pos]-'0'] = new ContactNode(name, number, node);
            // Add to name index for name-based search
            this.nameIndex.set(name.toLowerCase(), {name: name, number: number});
            console.log(`Contact added to trie. Name index now has ${this.nameIndex.size} entries`);
            return;
        }
        if(node.children[number[pos]-'0']===null){
            let newnode = new TrieNode();
            node.children[number[pos]-'0'] = newnode;
            newnode.parent = node;
            console.log(`Created new TrieNode at position ${pos} for digit ${number[pos]}`);
        }
        this.add(number, name, pos+1, node.children[number[pos]-'0']);
    }


    ///////////////////////////////////////////////////////// DELETE AN EXISTING CONTACT
    del(number, pos = 0, node = this.root){
        if(pos===number.length-1){
            // Remove from name index before deleting
            if(node.children[number[pos]-'0'] instanceof ContactNode) {
                const contact = node.children[number[pos]-'0'];
                this.nameIndex.delete(contact.name.toLowerCase());
            }
            node.children[number[pos]-'0'] = null;
            return;
        }

        if(node.children[number[pos]-'0']===null){
            return; // Number doesn't exist
        }
        this.del(number, pos+1, node.children[number[pos]-'0']);
    }

    ///////////////////////////////////////////////////////// SEARCH BY NAME
    searchByName(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for(const [name, contact] of this.nameIndex) {
            if(name.includes(lowerQuery)) {
                results.push(contact);
            }
        }
        
        return results;
    }

    ///////////////////////////////////////////////////////// SEARCH BY PHONE NUMBER
    searchByNumber(query) {
        this.current = this.root;
        this.res = [];
        
        // Navigate to the node corresponding to the query
        for(let i = 0; i < query.length; i++) {
            const digit = query[i] - '0';
            if(this.current.children[digit] === null) {
                return [];
            }
            this.current = this.current.children[digit];
        }
        
        // Find all contacts from this node
        this.findAll(this.current);
        return this.res;
    }

    ///////////////////////////////// SEARCH ALL CONTACTS BEGINNING FROM THE TYPED DIGITS
    findAll(node){
        // Contact leaf node
        if(node===null)
            return;
        if(node instanceof ContactNode){
            this.res.push(node);
            return;
        }
        for(let i=0;i<10;i++){
            this.findAll(node.children[i]);
        }
    }

    /////////////////////////////////////////////////////////
    findNext(step){
        if(step===-1){
            this.current = this.current.parent;
        } else if(step!==-2) {
            if(this.current.children[step-'0']===null){
                let newnode = new TrieNode();
                this.current.children[step-'0'] = newnode;
                newnode.parent = this.current;
            }

            this.current = this.current.children[step-'0'];
        }
        this.res = [];
        this.findAll(this.current);
        return this.res;
    }

    ///////////////////////////////////////////////////////// UNIFIED SEARCH
    search(query) {
        console.log(`Search called with query: "${query}"`);
        
        if(!query || query.trim() === '') {
            console.log('Empty query, searching for all contacts...');
            console.log('Name index contents:', Array.from(this.nameIndex.entries()));
            
            // For empty query, return all contacts from name index
            const allContacts = Array.from(this.nameIndex.values());
            console.log('All contacts found:', allContacts);
            return allContacts;
        }
        
        query = query.trim();
        
        // Check if query is numeric (phone number search)
        if(/^\d+$/.test(query)) {
            console.log('Numeric query, using searchByNumber');
            return this.searchByNumber(query);
        } else {
            console.log('Text query, using searchByName');
            return this.searchByName(query);
        }
    }
}

// Make Trie globally available
window.Trie = Trie;